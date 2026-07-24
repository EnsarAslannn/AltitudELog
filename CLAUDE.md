# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This started as a migration from a default ASP.NET Core Web API scaffold to a **Clean Architecture + CQRS**
solution, targeting .NET 10, for an aviation flight/CRM logging domain (pilots, flights, crew assignments, CRM
reports). That migration is now substantially complete: full CQRS coverage for `Flight`/`Pilot`/`Crew`/`CRMReport`
(not just `Auth`), FluentValidation on the write side (Flights/Crew/CRMReports — **not** `Auth`, see gap below),
role-based authorization (`Captain`-only writes on Flights/Crew), a global exception-handling pipeline mapped to
`ProblemDetails`, Redis-backed query caching, Hangfire background jobs (Postgres storage) driving an
auto-fetched METAR weather lookup on flight creation, Serilog structured logging, health checks, two test
projects (unit + Testcontainers-backed integration), a CI workflow, and a full React/TypeScript frontend
(`frontend/`, see its own section below). All of this exists and works end-to-end.

**Real, current gaps — do not assume otherwise, and do not add without an explicit go-ahead:**
- `Auth/Commands/Register` and `Auth/Commands/Login` have **no FluentValidation validators** (every other
  write-side command does). Input shape checking there is still ad hoc in the handler.
- No command invalidates the `pilots:all` cache key — `Register` doesn't, and there's no separate
  create-pilot command. The pilot list can serve a stale cache entry for up to its 5-minute expiry after a
  new pilot registers.
- `ICurrentUserService` (`AltitudELog.API/Services/CurrentUserService.cs`) is registered in DI but not consumed
  by any handler yet — it reads the JWT `NameIdentifier` claim and looks scaffolded ahead of a feature (e.g.
  attributing non-anonymous CRM reports to the caller) that hasn't landed.
- No CI/local requirement to actually run Redis or Hangfire in dev beyond what's described below — see
  "Background jobs & caching".

## Solution structure

```
AltitudELog.slnx                        # .NET 10 SDK's XML-based solution format (successor to .sln)
src/
  AltitudELog.API/            # ASP.NET Core host: controllers, Program.cs, appsettings
  AltitudELog.Domain/         # Entities, no dependencies on other layers
  AltitudELog.Application/    # CQRS (commands/queries), depends on Domain only
  AltitudELog.Infrastructure/ # EF Core / persistence / external services, depends on Application
tests/
  AltitudELog.Application.UnitTests/  # Handler/validator unit tests, EF Core InMemory, xUnit + NSubstitute
  AltitudELog.IntegrationTests/       # WebApplicationFactory + Testcontainers (Postgres, Redis), xUnit
frontend/                     # React 19 + TypeScript + Vite + Tailwind SPA — see "Frontend" below
```

Dependency direction (enforce this — don't add references that point the other way):
`API → Application, Infrastructure` · `Infrastructure → Application` · `Application → Domain` · `Domain → (nothing)`.
`Infrastructure` reaches `Domain` only transitively through `Application` — do not add a direct
`Infrastructure → Domain` project reference. `tests/AltitudELog.IntegrationTests` references `AltitudELog.API`
directly (it boots the whole app via `WebApplicationFactory<Program>`); `tests/AltitudELog.Application.UnitTests`
references only `AltitudELog.Application`.

### Domain (`src/AltitudELog.Domain`)

Plain POCOs, no package or project references (not even EF Core) — keep it that way.

- `Entities/`: `Pilot`, `Flight`, `Crew`, `CRMReport`. All use `Guid` ids.
  - `Pilot` doubles as the auth identity — it carries `Username` and `PasswordHash` directly (no separate `User`
    entity/table). `Rank` is embedded as the JWT role claim on login, so a pilot's rank *is* their authorization role.
    Registration accepts a self-selected `Rank` (`RegisterCommand.Rank`, optional, defaults to `Trainee`,
    validated with `Enum.IsDefined`) — a deliberate demo choice so visitors to the public deployment can pick
    Captain and try the Captain-only write features. This intentionally trades away the earlier "force Trainee"
    privilege-escalation guard; do not re-add that guard without a go-ahead.
  - `Crew` is an explicit join entity between `Flight` and `Pilot` (not an EF Core implicit skip-navigation) — it
    carries a flight-specific `DutyRole`, separate from `Pilot.Rank` (a pilot's general rank vs. their role on one
    particular flight can differ). A unique composite index on `(FlightId, PilotId)` plus a handler-level check
    both reject duplicate assignments.
  - `CRMReport.ReporterId` (nullable FK to `Pilot`) is tracked even when `IsAnonymous` is true — anonymity is
    enforced at the application/presentation layer, not by omitting the data. This is intentional for
    accountability/audit purposes.
  - `Flight.METARInfo` is populated asynchronously after creation by a Hangfire job, not at creation time — see
    "Background jobs & caching".
- `Enums/`: `PilotRank`, `DutyRole`, `SeverityLevel`.

### Application (`src/AltitudELog.Application`)

- References `MediatR` (pinned to **12.4.1** — MediatR v13+ requires a commercial license from Lucky Penny
  Software above a revenue threshold; 12.x and earlier stay Apache 2.0/MIT. Do not bump past 12.x without
  re-confirming the license situation), `FluentValidation` + `FluentValidation.DependencyInjectionExtensions`
  (11.11.0), `Hangfire.Core` (job/DI contracts only — the server + Postgres storage live in Infrastructure),
  `Microsoft.Extensions.Caching.Abstractions` (`IDistributedCache` contract, for the caching pipeline behaviors),
  `Microsoft.EntityFrameworkCore` (core package only, for `DbSet<T>`/`IQueryable` — no provider dependency here),
  and `Microsoft.Extensions.Identity.Core` (for `PasswordHasher<Pilot>` only — not the full ASP.NET Core Identity
  system, no `IdentityDbContext`/stores). `Newtonsoft.Json` is also referenced but has no confirmed direct usage —
  don't assume it's load-bearing; verify before relying on it or removing it.
- `Common/Interfaces/IApplicationDbContext.cs`: the persistence abstraction Application codes against, instead of
  a concrete `DbContext`. Exposes `DbSet<Flight> Flights` and `DbSet<Pilot> Pilots` — extend it per-entity as new
  features need them, don't add speculative `DbSet`s ahead of use.
- `Common/Interfaces/IJwtTokenGenerator.cs`: abstraction for JWT issuance (`GenerateToken(Pilot) -> (Token,
  ExpiresAtUtc)`), implemented in Infrastructure so Application stays free of `System.IdentityModel.Tokens.Jwt`.
- `Common/Interfaces/IMetarService.cs`: `GetRawMetarAsync(icaoCode, ct) -> string?` — abstraction over the METAR
  weather lookup, implemented in Infrastructure by `NoaaMetarService`.
- `Common/Behaviors/`: the MediatR pipeline, registered in this exact order (see `DependencyInjection.cs`) —
  `ValidationBehavior<,>` → `CachingBehavior<,>` → `CacheInvalidationBehavior<,>`. Order matters: validation
  short-circuits before anything touches the cache or the handler.
  - `ValidationBehavior`: runs every registered `IValidator<TRequest>`; throws `FluentValidation.ValidationException`
    on failure (mapped to `400` by `ValidationExceptionHandler` in the API — see below).
  - `CachingBehavior`: only acts when `TRequest : ICacheableQuery`; reads/writes through `IDistributedCache`
    (Redis) with `CacheSerializerOptions` (JSON, string enum converter). **Fail-open**: cache read/write
    exceptions (e.g. Redis unreachable) are caught, logged as a warning, and the request falls through to the
    real handler instead of 500ing — do not remove this try/catch, a down cache must never take the API down.
  - `CacheInvalidationBehavior`: runs `next()` first, then if `TRequest : ICacheInvalidatorCommand`, removes each
    key in `CacheKeysToInvalidate`. Same fail-open behavior as above.
- `Common/Caching/`: `ICacheableQuery` (`CacheKey`, `Expiry`), `ICacheInvalidatorCommand` (`CacheKeysToInvalidate`),
  and `CacheKeys` — the single place cache key strings are constructed (`flights:all`, `pilots:all`,
  `crew:flight:{id}`, `crmreports:flight:{id}`). Add new keys here, don't inline literals in handlers.
- Feature folders under vertical slices, not by technical layer:
  - `Auth/Commands/Register/`, `Auth/Commands/Login/` — no validators (see gap above), not cached.
  - `Flights/Commands/CreateFlight/` (+ `CreateFlightCommandValidator`, invalidates `flights:all`),
    `Flights/Queries/GetFlights/` (cached, `flights:all`, 5 min), `Flights/Events/FlightCreatedEvent` +
    `FlightCreatedEventHandler` (MediatR notification published after a flight is saved; enqueues the METAR
    Hangfire job), `Flights/Jobs/UpdateFlightMetarJob` (the Hangfire job itself — not a MediatR request).
  - `Pilots/Queries/GetPilots/` (cached, `pilots:all`, 5 min) — no create-pilot command outside `Register`.
  - `Crew/Commands/CreateCrew/` (+ validator: both `FlightId`/`PilotId` FK existence checked via `MustAsync`,
    invalidates `crew:flight:{flightId}`), `Crew/Queries/GetCrewByFlight/` (cached per flight, 5 min).
  - `CRMReports/Commands/CreateCRMReport/` (+ validator: `FlightId` FK exists, `Title` ≤200, `Description` ≤4000,
    invalidates `crmreports:flight:{flightId}`), `CRMReports/Queries/GetCRMReportsByFlight/` (cached per flight,
    5 min).
  - Each command/query, its handler, and any feature-specific DTO live together in its folder.
- `DependencyInjection.cs`: `AddApplicationServices()` registers `FluentValidation` validators from this assembly
  and MediatR (with the three pipeline behaviors above, in order) against this assembly. Called from `Program.cs`.

### Infrastructure (`src/AltitudELog.Infrastructure`)

- References `Microsoft.EntityFrameworkCore` + `Microsoft.EntityFrameworkCore.Relational` +
  **`Npgsql.EntityFrameworkCore.PostgreSQL`** (10.0.3) — PostgreSQL is the persistence provider — plus
  `System.IdentityModel.Tokens.Jwt` for JWT issuance, `Microsoft.Extensions.Caching.StackExchangeRedis` (Redis
  `IDistributedCache` implementation), `Hangfire.AspNetCore` + `Hangfire.PostgreSql` (background jobs, storage
  reuses the same Postgres database), `Microsoft.Extensions.Http` (typed `HttpClient` for the METAR service), and
  `AspNetCore.HealthChecks.NpgSql` + `AspNetCore.HealthChecks.Redis` (the `/health` endpoint checks both).
- `Persistence/Configurations/`: one `IEntityTypeConfiguration<T>` per entity (`PilotConfiguration`,
  `FlightConfiguration`, `CrewConfiguration`, `CRMReportConfiguration`). Enums are stored as strings
  (`HasConversion<string>()`) for DB readability. `PilotConfiguration` enforces a unique index on `Username` and
  `LicenseNumber`; `CrewConfiguration` enforces a unique composite index on `(FlightId, PilotId)` to reject
  duplicate crew assignments at the DB level (in addition to the handler-level check).
- `Persistence/ApplicationDbContext.cs`: implements `IApplicationDbContext`, applies all configurations via
  `ApplyConfigurationsFromAssembly`. `Crew` and `CRMReport` have no explicit `DbSet` on the interface — still part
  of the EF model through `Flight`'s navigation properties.
- `Persistence/Migrations/`: EF Core migrations live here (in Infrastructure, next to the `DbContext`), not in
  API. Three so far, all applied: `InitialCreate` (creates `Flights`, `Pilots`, `Crew`, `CRMReports`),
  `AddPilotAuthFields` (`Pilots.Username` unique, `Pilots.PasswordHash`), `FormalizeNonClusteredIndexes` — this
  one has an **empty `Up()`/`Down()`**, it's a no-op that just records index state already reflected in the
  model snapshot; don't expect a schema diff from it. Hangfire manages its own Postgres schema independently —
  no EF migration needed or expected for it.
- `Identity/JwtTokenGenerator.cs`: implements `IJwtTokenGenerator` — HMAC-SHA256 signed token, claims are
  `NameIdentifier` (Pilot Id), `Name` (Username), `Role` (`Pilot.Rank.ToString()`, e.g. `"Captain"`). Reads
  `Jwt:Key`/`Jwt:Issuer`/`Jwt:Audience`/`Jwt:ExpiryMinutes` from `IConfiguration` directly (same pattern as the
  connection-string read below, not a bound options class shared across layers).
- `ExternalServices/Metar/NoaaMetarService.cs`: implements `IMetarService` against the public NOAA aviation
  weather API. Base URL (`https://aviationweather.gov/`) and a 10s timeout are set where the typed `HttpClient`
  is registered in `DependencyInjection.cs` — **hardcoded, not in `appsettings`**. Calls
  `GET api/data/metar?ids={icao}&format=json`, returns the first observation's raw METAR text or `null` if none.
- Delete behaviors were chosen deliberately to protect CRM safety data from accidental loss:
  `Crew→Flight` cascades, `Crew→Pilot` and `CRMReport→Flight` restrict, `CRMReport→Reporter` sets null.
- `DependencyInjection.cs`: `AddInfrastructureServices(IConfiguration)` registers `ApplicationDbContext` via
  `UseNpgsql(configuration.GetConnectionString("DefaultConnection"))`, maps `IApplicationDbContext` to it,
  registers `IJwtTokenGenerator -> JwtTokenGenerator`, `AddStackExchangeRedisCache` against
  `ConnectionStrings:Redis`, health checks for both Postgres and Redis, the typed `IMetarService` `HttpClient`,
  and Hangfire (Postgres storage) + `AddHangfireServer()`. Called from `Program.cs` as
  `AddInfrastructureServices(builder.Configuration)`.

**Connection string / secrets convention:** `appsettings.json`'s `ConnectionStrings:DefaultConnection` holds a
literal placeholder password (`KENDI_SIFRENIZI_BURAYA_YAZIN`) — it is **not** meant to be a real credential in a
committed file. The real local password lives in .NET User Secrets for the API project (`UserSecretsId` set via
`dotnet user-secrets init`), which overrides the same config key at runtime. `ConnectionStrings:Redis`
(`localhost:6379`) is committed as a real (non-secret) default since it's just a local dev endpoint, not a
credential. To point a fresh dev machine at a different local Postgres password, run:

```
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=altitudelog;Username=postgres;Password=<real password>" --project src/AltitudELog.API
```

`dotnet ef` commands (migrations, `database update`) read the same configuration, so they also need this secret
set to reach the real database — `migrations add` itself doesn't need a live connection (it only diffs the
model), but `database update` does.

The same convention applies to the JWT signing key: `appsettings.json`'s `Jwt:Key` holds a literal placeholder
(`KENDI_JWT_ANAHTARINIZI_BURAYA_YAZIN_EN_AZ_32_KARAKTER`), and the real key lives in User Secrets:
```
dotnet user-secrets set "Jwt:Key" "<gerçek-güçlü-anahtar, en az 32 karakter>" --project src/AltitudELog.API
```
`Program.cs` fails fast at startup (throws before `app.Run()`) if `Jwt:Key` is missing or shorter than 32 bytes —
this is not silent/lenient.

The Hangfire dashboard (`/hangfire`) is Basic-auth protected via `Hangfire:DashboardUsername`/
`Hangfire:DashboardPassword`, same placeholder-in-`appsettings.json`/real-value-in-User-Secrets convention:
```
dotnet user-secrets set "Hangfire:DashboardUsername" "<username>" --project src/AltitudELog.API
dotnet user-secrets set "Hangfire:DashboardPassword" "<password>" --project src/AltitudELog.API
```
`HangfireBasicAuthFilter` (`src/AltitudELog.API/Common/HangfireBasicAuthFilter.cs`) **fails closed**: if either
value is unset/empty, it challenges/401s rather than allowing access — do not change this to fail open.

### API — Auth endpoints

`Controllers/AuthController.cs`: `POST /Auth/register` (→ `RegisterCommand`, returns the new Pilot `Guid`,
registers with the caller-supplied `Rank`, defaulting to `Trainee` when omitted), `POST /Auth/login` (→ `LoginCommand`, returns
`AuthResponseDto` with the JWT, or `401` on bad credentials via a caught `UnauthorizedAccessException`). Both
anonymous — registering/logging in obviously can't require a token.

### API — Flights, Crew, CRMReports, Pilots endpoints

- `Controllers/FlightsController.cs`: `POST /Flights` (→ `CreateFlightCommand`, returns the new `Guid`,
  **`[Authorize(Roles = "Captain")]`** — only Captains can log flights), `GET /Flights` and `GET /Flights/{id}`
  (→ `GetFlightsQuery`/`GetFlightByIdQuery`, **`[Authorize]`** — any authenticated pilot, not anonymous),
  `PUT /Flights/{id}` and `POST /Flights/{id}/cancel` (**`[Authorize(Roles = "Captain")]`**, throw
  `NotFoundException` → `404` for a nonexistent `FlightId`, see "API — Global exception handling"). Creating a
  flight publishes `FlightCreatedEvent`, which enqueues the METAR-fetch Hangfire job — see "Background jobs &
  caching".
- `Controllers/CrewController.cs`: class-level `[Authorize]`. `POST /Crew` (→ `CreateCrewCommand`,
  **`[Authorize(Roles = "Captain")]`** override, tightens the class-level attribute), `GET /Crew/flight/{flightId}`
  (→ `GetCrewByFlightQuery`, any authenticated pilot).
- `Controllers/CRMReportsController.cs`: class-level `[Authorize]`, no extra role restriction. `POST /CRMReports`
  (→ `CreateCRMReportCommand`), `GET /CRMReports/flight/{flightId}` (→ `GetCRMReportsByFlightQuery`) — any
  authenticated pilot can create/read CRM reports.
- `Controllers/PilotsController.cs`: `GET /Pilots` (→ `GetPilotsQuery`, `[Authorize]`, any authenticated pilot) —
  used by the frontend's crew-assignment picker.

All controllers go through `IMediator.Send`, no direct Application/Infrastructure calls. Sample requests in
`AltitudELog.API.http`.

### API — Global exception handling

`Common/DomainExceptionHandler.cs` and `Common/ValidationExceptionHandler.cs`, registered via
`AddExceptionHandler<T>()` (in that order: Validation, then Domain) + `AddProblemDetails()`, activated by
`app.UseExceptionHandler()`. Mapping: `FluentValidation.ValidationException` → `400` with a
`ValidationProblemDetails` per-field error shape, `UnauthorizedAccessException` → `401`,
`AltitudELog.Application.Common.Exceptions.NotFoundException` → `404`, `InvalidOperationException` → `409`
(reserved for genuine conflicts — duplicate crew assignment, duplicate username; "does not exist" cases should
throw `NotFoundException` instead, not `InvalidOperationException`). Anything unmapped falls through to the
default ASP.NET Core `ProblemDetails` `500` response. The frontend's `ApiError`/`toApiError`
(`frontend/src/lib/axios.ts`) is written against this exact shape.

### API — CORS, health checks, Hangfire dashboard

- CORS: a single named policy `FrontendCorsPolicy` (`Program.cs`), origin `http://localhost:5180` only (matches
  `frontend/vite.config.ts`'s `server.port = 5180` with `strictPort: true`), `AllowAnyHeader()` +
  `AllowAnyMethod()`, no `AllowCredentials()`. `UseCors()` runs before `UseAuthentication()`/`UseAuthorization()`
  in the pipeline. If the frontend dev port ever changes, this origin must be updated to match.
- Health checks: `GET /health`, unauthenticated by design, checks Postgres (`AddNpgSql`) and Redis (`AddRedis`),
  custom JSON response writer (`Common/HealthCheckResponseWriter.cs`) reporting overall status, total duration,
  and per-check name/status/description/duration.
- Hangfire dashboard: `GET /hangfire`, Basic-auth protected (see secrets convention above), fails closed if
  credentials aren't configured.

## Background jobs & caching

**METAR flow**: `POST /Flights` (Captain-only) → `CreateFlightCommandHandler` saves the `Flight` → publishes
`FlightCreatedEvent` (MediatR notification) → `FlightCreatedEventHandler` enqueues `UpdateFlightMetarJob` via
`IBackgroundJobClient.Enqueue` (fire-once, not scheduled/recurring — there is no `RecurringJob.*` usage anywhere
in the codebase) → the Hangfire server (Postgres-backed queue) picks it up and runs
`UpdateFlightMetarJob.ExecuteAsync`, which calls `IMetarService.GetRawMetarAsync(icaoCode)`, sets
`flight.METARInfo` if a result came back, saves, and removes the `flights:all` Redis key directly (it isn't a
MediatR command, so it bypasses `CacheInvalidationBehavior` and calls `IDistributedCache.RemoveAsync` itself).
This means a newly created flight's METAR is **not** present in the `POST /Flights` response — it appears
asynchronously once the job runs and the next `GET /Flights` misses the (now-invalidated) cache.

**Redis caching** (all via `ICacheableQuery`/`ICacheInvalidatorCommand`, all 5-minute absolute expiry):

| Query | Cache key | Invalidated by |
|---|---|---|
| `GetFlightsQuery` | `flights:all` | `CreateFlightCommand`, `UpdateFlightMetarJob` (directly) |
| `GetPilotsQuery` | `pilots:all` | *nothing currently* (see gap above) |
| `GetCrewByFlightQuery(flightId)` | `crew:flight:{flightId}` | `CreateCrewCommand` (same flight only) |
| `GetCRMReportsByFlightQuery(flightId)` | `crmreports:flight:{flightId}` | `CreateCRMReportCommand` (same flight only) |

Both caching pipeline behaviors are **fail-open**: if Redis is unreachable, the request still succeeds (served
from/written straight to Postgres, cache step skipped with a logged warning) rather than the API returning a
`500`. This is deliberate — verify it still holds if you touch `CachingBehavior`/`CacheInvalidationBehavior`.

For local dev, both Postgres and Redis need to actually be running for the full feature set (and for
`dotnet test` at the solution level, since `AltitudELog.IntegrationTests` spins up its own Postgres 17 + Redis
Alpine via Testcontainers, which requires Docker to be running). Missing Redis degrades gracefully (see above);
missing Postgres does not (Postgres is not optional — EF Core, Hangfire storage, and health checks all depend on
it being reachable).

## Frontend (`frontend/`)

React 19 + TypeScript + Vite 8 + Tailwind CSS 4 SPA, talking to the API over `axios`. Not part of the .NET
solution/build — it's a separate `npm` project.

- `src/pages/`: `LoginPage`, `RegisterPage`, `DashboardPage` (flight list), `FlightDetailPage` (crew + CRM report
  tabs), `CreateFlightPage` (Captain-only), `UnauthorizedPage`, `NotFoundPage`.
- `src/routes/`: `ProtectedRoute` (redirects to `/login` if not authenticated), `CaptainRoute` (redirects to
  `/unauthorized` if `rank !== 'Captain'`) — mirrors the API's `[Authorize(Roles = "Captain")]` gates, wraps only
  `/flights/new` in `src/router.tsx`.
- `src/store/authStore.ts`: `zustand` store (persisted to `localStorage` under the `altitudelog-auth` key) holding
  the JWT, pilot id, username, rank.
- `src/lib/axios.ts`: single `apiClient` instance, attaches the bearer token from the auth store on every
  request, auto-logs-out and redirects to `/login` on a `401` response, normalizes error responses into the
  `ApiError` shape matching the API's `ProblemDetails`/`ValidationProblemDetails` output.
- `src/services/`: one thin service module per backend resource (`authService`, `flightService`, `crewService`,
  `crmReportService`, `pilotService`), all going through `apiClient`.
- `src/components/ui/`: shared primitives (`Button`, `Card`, `Input`, `Select`, `Badge`, `Skeleton`, `Spinner`).
  Visual language is a "Trust Navy" enterprise look — dark navy (`slate-900`) top nav over a light content area,
  amber used specifically as a Captain/PIC "command" accent, everything else blue/slate. Keep new UI consistent
  with these primitives rather than one-off styling in pages.
- Config: `frontend/.env.development` sets `VITE_API_BASE_URL=http://localhost:5264` (must match the API's http
  launch profile). `vite.config.ts` pins the dev server to port `5180` with `strictPort: true` — this exact port
  is what the API's CORS policy allows; changing it requires updating `Program.cs` too.

Commands (run from `frontend/`): `npm install`, `npm run dev` (Vite dev server, port 5180),
`npm run build` (`tsc -b && vite build`), `npm run lint` (`oxlint`), `npm run preview`.

## Commands

Run all commands from the repo root against the solution file, or use `--project src/AltitudELog.API` for the API
specifically.

- Restore: `dotnet restore`
- Build: `dotnet build AltitudELog.slnx`
- Run (http profile, `http://localhost:5264`): `dotnet run --project src/AltitudELog.API --launch-profile http`
- Run (https profile, `https://localhost:7240`): `dotnet run --project src/AltitudELog.API --launch-profile https`
- OpenAPI document is only mapped when `ASPNETCORE_ENVIRONMENT=Development` (set by both launch profiles), served via
  `AddOpenApi()`/`MapOpenApi()` — there is no Swagger UI wired up.
- `dotnet sln AltitudELog.slnx list` shows registered projects.
- New migration: `dotnet ef migrations add <Name> --project src/AltitudELog.Infrastructure --startup-project src/AltitudELog.API --output-dir Persistence/Migrations`
- Apply migrations: `dotnet ef database update --project src/AltitudELog.Infrastructure --startup-project src/AltitudELog.API`
- Requires a local PostgreSQL reachable at the configured connection string (see secrets convention above) and
  the `dotnet-ef` tool (`dotnet tool install --global dotnet-ef` if not already present).
- Test: `dotnet test AltitudELog.slnx` runs both `tests/AltitudELog.Application.UnitTests` (fast, no external
  deps, EF Core InMemory) and `tests/AltitudELog.IntegrationTests` (spins up Postgres 17 + Redis Alpine via
  Testcontainers — **Docker must be running**, or those tests fail with a `DockerUnavailableException` rather
  than a real test failure). To run only the fast unit tests:
  `dotnet test tests/AltitudELog.Application.UnitTests`.
- CI: `.github/workflows/ci.yml` runs `dotnet test` on push/PR.
- The previously-flagged NU1903 advisory (`Microsoft.OpenApi` 2.0.0, transitive via `Microsoft.AspNetCore.OpenApi`)
  no longer applies — `AltitudELog.API` now pins `Microsoft.OpenApi` 2.11.0 directly. Re-check with
  `dotnet list package --vulnerable` if package versions move again rather than assuming this stays fixed.

## Architecture notes

- Hosting model in `AltitudELog.API/Program.cs` (top-to-bottom, order is load-bearing throughout):
  bootstrap Serilog logger (console-only, for startup failures) → `builder.Host.UseSerilog(...)` (full config-
  driven logging) → `AddControllers()` (with `JsonStringEnumConverter`, matching the `HasConversion<string>()` DB
  storage) → `AddOpenApi()` → `AddApplicationServices()` + `AddInfrastructureServices()` → `AddHttpContextAccessor()`
  + `AddScoped<ICurrentUserService, CurrentUserService>()` → `AddExceptionHandler<ValidationExceptionHandler>()` +
  `AddExceptionHandler<DomainExceptionHandler>()` + `AddProblemDetails()` → `AddCors("FrontendCorsPolicy")` →
  `AddAuthentication().AddJwtBearer(...)` + `AddAuthorization()` (plain, no named policies — role checks are all
  inline `[Authorize(Roles = "...")]`) → `builder.Build()` → **fail-fast Jwt:Key length/presence check** (throws
  before the app starts serving) → conditional `MapOpenApi()` in Development → `UseExceptionHandler()` →
  `UseSerilogRequestLogging()` → `UseHttpsRedirection()` → `UseCors("FrontendCorsPolicy")` → `UseAuthentication()`
  → `UseAuthorization()` → `MapControllers()` → `MapHealthChecks("/health", ...)` → `UseHangfireDashboard("/hangfire", ...)`.
  `UseAuthentication()` must precede `UseAuthorization()`; `UseCors()` must precede both.
- Controllers live under `AltitudELog.API/Controllers/` and use attribute routing (`[Route("[controller]")]`).
- `Nullable` and `ImplicitUsings` are enabled across all projects (including both test projects) — new code
  should follow nullable-reference-type conventions rather than disabling them.

  ## Development Guidelines & Token-Saving Rules

- **No Conversational Filler**: Respond directly, omitting greetings, apologetic language, or verbose explanations.
- **Surgical File Access**: Do NOT read entire directories. Ask for explicit file targets or use exact `@filename` references to minimize context bloat.
- **Plan Mode First**: Always enter `Plan Mode` for any task requiring >2 steps. Propose changes, list specific files to modify, and wait for confirmation before writing code.
- **Applied Learning (<15 words)**: On any correction, append the lesson to `tasks/lessons.md` using a single line (max 15 words) to avoid repeating mistakes.
- **Quiet Verification**: Before declaring a task complete, verify with `dotnet build AltitudELog.slnx` using minimal logs.

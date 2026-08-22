# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This started as a migration from a default ASP.NET Core Web API scaffold to a **Clean Architecture + CQRS**
solution, targeting .NET 10, for an aviation flight/CRM logging domain (pilots, flights, crew assignments, CRM
reports). That migration is now substantially complete: full CQRS coverage for `Flight`/`Pilot`/`Crew`/`CRMReport`
(including `Auth`), FluentValidation on the write side across every feature (Flights/Crew/CRMReports/Auth),
role-based authorization (`Captain`-only writes on Flights/Crew), a global exception-handling pipeline mapped to
`ProblemDetails`, Redis-backed query caching, Hangfire background jobs (Postgres storage) driving an
auto-fetched METAR weather lookup on flight creation, Serilog structured logging, health checks, two test
projects (unit + Testcontainers-backed integration), a CI workflow (backend tests + frontend build/lint/test),
and a full React/TypeScript frontend (`frontend/`, see its own section below). All of this exists and works
end-to-end. Also shipped, beyond the original migration scope: JWT refresh tokens with rotation-on-use,
forgot/reset-password, flight cancellation with an EF Core (`xmin`) optimistic-concurrency token, IP-based rate
limiting on all `Auth` endpoints, pilot profile/logbook views (+ CSV/PDF export), a stats dashboard, and pilot
certificate expiry tracking.

**Real, current gaps — do not assume otherwise, and do not add without an explicit go-ahead:**
- No CI/local requirement to actually run Redis or Hangfire in dev beyond what's described below — see
  "Background jobs & caching".
- Refresh tokens (and the JWT itself) are persisted in the frontend's `localStorage` (`authStore.ts`), not an
  httpOnly cookie — a deliberate demo/simplicity trade-off, same spirit as the self-selectable `Rank` below. In
  a production-hardened build, the refresh token would live in an httpOnly+Secure cookie instead, so an XSS
  can't read it. Do not silently "fix" this by refactoring token storage without an explicit go-ahead — it's a
  real architectural change (touches `/Auth/refresh`/`/Auth/logout`, CORS credentials, the axios interceptor).

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
    `Username`, `Email` and `LicenseNumber` are stored **normalised** via
    `Application/Common/Security/CredentialNormalizer.cs`, because Postgres's default collation is
    case-sensitive and all three columns carry unique indexes — otherwise "Ensar" and "ensar" are two accounts,
    forgot-password silently no-ops for a differently-cased address, and `TR-1234` / `tr-1234` / `" TR-1234 "`
    are three separate licences. Every write *and* every lookup
    (`RegisterCommandHandler`, `LoginCommandHandler`, `ForgotPasswordCommandHandler`) must go through the
    normalizer; a normalised write with an unnormalised lookup is worse than neither. `Username`/`Email`
    lower-case, `LicenseNumber` **upper**-cases — the direction is irrelevant to uniqueness, but a licence
    number is rendered verbatim on the profile, the pilot list and the logbook PDF, where `tr-1234` reads as a
    bug. `Pilot` also maps `xmin` as an EF Core concurrency token, for the same reason `Flight` does — see
    "Refresh-token sessions" below.
  - `Crew` is an explicit join entity between `Flight` and `Pilot` (not an EF Core implicit skip-navigation) — it
    carries a flight-specific `DutyRole`, separate from `Pilot.Rank` (a pilot's general rank vs. their role on one
    particular flight can differ). A unique composite index on `(FlightId, PilotId)` plus a handler-level check
    both reject duplicate assignments.
  - `CRMReport.ReporterId` (nullable FK to `Pilot`) is tracked even when `IsAnonymous` is true — anonymity is
    enforced at the application/presentation layer, not by omitting the data. This is intentional for
    accountability/audit purposes.
  - `Flight.METARInfo` is populated asynchronously after creation by a Hangfire job, not at creation time — see
    "Background jobs & caching". `CreateFlightCommand` does not accept it as input; a Captain cannot set it at
    creation, only the Hangfire job writes it.
  - `Flight.IsCancelled` guards a one-way transition (`POST /Flights/{id}/cancel`) — `UpdateFlightCommandHandler`
    and `CancelFlightCommandHandler` both reject any further mutation of an already-cancelled flight.
    `FlightConfiguration` also maps the Postgres `xmin` system column as an EF Core optimistic-concurrency token
    (`Property<uint>("xmin").IsRowVersion()`, not `UseXminAsConcurrencyToken()` — that method doesn't exist on
    this Npgsql provider version) — a stale concurrent update throws `DbUpdateConcurrencyException`, mapped to
    `409` (see "API — Global exception handling").
- `Enums/`: `PilotRank`, `DutyRole`, `SeverityLevel`.

### Application (`src/AltitudELog.Application`)

- References `MediatR` (pinned to **12.4.1** — MediatR v13+ requires a commercial license from Lucky Penny
  Software above a revenue threshold; 12.x and earlier stay Apache 2.0/MIT. Do not bump past 12.x without
  re-confirming the license situation), `FluentValidation` + `FluentValidation.DependencyInjectionExtensions`
  (11.11.0), `Hangfire.Core` (job/DI contracts only — the server + Postgres storage live in Infrastructure),
  `Microsoft.Extensions.Caching.Abstractions` (`IDistributedCache` contract, for the caching pipeline behaviors),
  `Microsoft.EntityFrameworkCore` (core package only, for `DbSet<T>`/`IQueryable` — no provider dependency here),
  and `Microsoft.Extensions.Identity.Core` (for `PasswordHasher<Pilot>` only — not the full ASP.NET Core Identity
  system, no `IdentityDbContext`/stores). A direct `Newtonsoft.Json` reference used to sit here too; it had no
  usage anywhere in the codebase and was removed — Hangfire.Core still brings it in transitively, so don't
  re-add it as a top-level reference.
- `Common/Interfaces/IApplicationDbContext.cs`: the persistence abstraction Application codes against, instead of
  a concrete `DbContext`. Exposes `DbSet<T>` for all four entities (`Flights`, `Pilots`, `Crew`, `CRMReports`) —
  extend it per-entity as new features need them, don't add speculative `DbSet`s ahead of use.
- `Common/Interfaces/IJwtTokenGenerator.cs`: abstraction for JWT issuance (`GenerateToken(Pilot) -> (Token,
  ExpiresAtUtc)`), implemented in Infrastructure so Application stays free of `System.IdentityModel.Tokens.Jwt`.
- `Common/Interfaces/IMetarService.cs`: `GetRawMetarAsync(icaoCode, ct) -> string?` — abstraction over the METAR
  weather lookup, implemented in Infrastructure by `NoaaMetarService`.
- `Common/Behaviors/`: the MediatR pipeline, registered in this exact order (see `DependencyInjection.cs`) —
  `ValidationBehavior<,>` → `CachingBehavior<,>` → `CacheInvalidationBehavior<,>`. Order matters: validation
  short-circuits before anything touches the cache or the handler.
  **All three are constrained `where TRequest : notnull`, never `where TRequest : IRequest<TResponse>`.**
  MediatR 12's non-generic `IRequest` — what every void command implements (`UpdateFlightCommand`,
  `CancelFlightCommand`, `UpdatePilotCertificatesCommand`, `ForgotPasswordCommand`, `ResetPasswordCommand`,
  `LogoutCommand`) — derives from `IBaseRequest`, **not** from `IRequest<Unit>`. With the tighter constraint the
  DI container silently fails the constraint check when closing the open generic over `<TVoidCommand, Unit>` and
  registers nothing at all: no exception, no log, and those six commands run with no validation and no cache
  invalidation whatsoever. `tests/AltitudELog.Application.UnitTests/Common/Behaviors/PipelineBehaviorRegistrationTests.cs`
  resolves the behaviors through a real container to guard this; `tests/AltitudELog.IntegrationTests/Common/
  VoidCommandValidationTests.cs` asserts it at the HTTP level. The behaviors' own unit tests construct them
  directly and so cannot catch it.
  - `ValidationBehavior`: runs every registered `IValidator<TRequest>`; throws `FluentValidation.ValidationException`
    on failure (mapped to `400` by `ValidationExceptionHandler` in the API — see below).
  - `CachingBehavior`: only acts when `TRequest : ICacheableQuery`; reads/writes through `IDistributedCache`
    (Redis) with `CacheSerializerOptions` (JSON, string enum converter). **Fail-open**: cache read/write
    exceptions (e.g. Redis unreachable) are caught, logged as a warning, and the request falls through to the
    real handler instead of 500ing — do not remove this try/catch, a down cache must never take the API down.
  - `CacheInvalidationBehavior`: runs `next()` first, then if `TRequest : ICacheInvalidatorCommand`, removes each
    key in `CacheKeysToInvalidate`. Same fail-open behavior as above.
- `Common/Caching/`: `ICacheableQuery` (`CacheKey`, `Expiry`), `ICacheInvalidatorCommand` (`CacheKeysToInvalidate`),
  and `CacheKeys` — the single place cache key strings are constructed (`pilots:all`, `stats:all`,
  `crew:flight:{id}`, `crmreports:flight:{id}`, `pilot:profile:{id}`). Add new keys here, don't inline literals
  in handlers. `ICacheInvalidatorCommand.CacheKeysToInvalidate` is normally a fixed expression-bodied property,
  but where the keys to invalidate aren't knowable from the command's own fields alone (e.g. `UpdateFlightCommand`/
  `CancelFlightCommand` need to invalidate `pilot:profile:{id}` for every pilot crewed on that flight, which
  requires a DB query), it's declared as a mutable `{ get; set; }` instead and the handler appends to it after
  `SaveChangesAsync` — `CacheInvalidationBehavior` reads it after `next()` returns, so this is safe.
- Feature folders under vertical slices, not by technical layer:
  - `Auth/Commands/Register/`, `Auth/Commands/Login/` — validated (`RegisterCommandValidator`,
    `LoginCommandValidator`), not cached. `Register` implements `ICacheInvalidatorCommand`, invalidating
    `pilots:all` and `stats:all` since a new pilot changes both listings.
  - **Refresh-token sessions** are governed by `Common/Security/RefreshTokenPolicy.cs`, which owns
    the sliding `Lifetime` (7d), the `AbsoluteLifetime` ceiling (30d) and the `StartSession` /
    `Rotate` / `RevokeSession` transitions — Login, RefreshToken, Logout and ResetPassword all go
    through it so they can't drift on what makes up a session. `Pilot.PreviousRefreshTokenHash`
    exists purely for **reuse detection**: rotation means an already-exchanged token matches no
    pilot at all, so without it a replay is indistinguishable from a random string and there is no
    way to know whose session to revoke. Presenting the previous token revokes the whole session
    (both tokens), and `RefreshTokenSessionStartedAtUtc` is set only at login and never bumped by
    a rotation — otherwise refreshing weekly keeps a session, and a stolen token, alive forever.
  - `Auth/Jobs/SendPasswordResetEmailJob`: issues the reset token *and* sends the mail, off the
    request path. It takes only a pilot id — the token is generated inside the job because
    Hangfire persists job arguments and renders them in the `/hangfire` dashboard, which is no
    place for a live reset token.
  - `Auth/Commands/ForgotPassword/` + `Auth/Commands/ResetPassword/`: same random-token pattern as refresh
    tokens below (32-byte `RandomNumberGenerator`, hashed at rest via `TokenHasher`, one-time use). Deliberately
    always returns success/`204` regardless of whether the email matches a pilot. Timing is kept
    even by keeping both branches' work comparable — a lookup, plus at most one enqueue — and then
    applying a `MinimumDuration` floor (`Stopwatch` + `Task.Delay`). **The floor alone was not
    enough**: it bounds the fast path from below but leaves the slow path unbounded above, and the
    matching branch used to `await` an SMTP round trip inline, so it stayed reliably slower and
    still leaked which addresses are registered. Token issuing and delivery therefore live in
    `SendPasswordResetEmailJob`, off the request path — don't move them back inline.
    `ResetPassword` also revokes the pilot's session, invalidating anything obtained before the reset.
  - `Auth/Commands/RefreshToken/` + `Auth/Commands/Logout/`: opaque refresh tokens (same
    generate-random/hash-at-rest pattern), stored on `Pilot.RefreshTokenHash`/`RefreshTokenExpiresAtUtc`,
    rotated on every successful refresh. `Logout` resolves the caller via `ICurrentUserService` and clears
    their stored refresh token. **Rotation is guarded by `Pilot`'s `xmin` concurrency token.** Without it,
    two concurrent refreshes presenting the same valid token both pass the reuse check and both rotate, and
    the second write leaves `PreviousRefreshTokenHash` pointing at a token that is still live — so the *next*
    legitimate refresh looks like a replay and revokes a healthy session. With the token in place the loser's
    `SaveChangesAsync` throws `DbUpdateConcurrencyException`, which this handler catches and answers as `401`
    rather than letting it reach the global `409` mapping: for the loser of a refresh race the honest answer is
    "that token is no longer valid". `tests/AltitudELog.IntegrationTests/Auth/RefreshTokenConcurrencyTests.cs`
    guards both halves against a real Postgres — InMemory ignores concurrency tokens, so a unit test cannot.
    Note this covers *interleaved* rotation only. Two refreshes that fully **serialise** still trip reuse
    detection and revoke the session by design, which is reachable from two browser tabs sharing one
    `localStorage` token; closing that needs a bounded grace window on the previous token, which deliberately
    weakens reuse detection and has not been done.
  - `Flights/Commands/CreateFlight/` (+ `CreateFlightCommandValidator`; does **not** accept a client-supplied
    `METARInfo` — that field is only ever set by `UpdateFlightMetarJob`, see "Background jobs & caching"),
    `Flights/Commands/UpdateFlight/` and `Flights/Commands/CancelFlight/` (both guard against mutating an
    already-`IsCancelled` flight, throwing `InvalidOperationException` → `409`; both also invalidate
    `pilot:profile:{id}` for every pilot currently crewed on that flight, since `GetPilotProfileQuery`'s
    hours/currency figures are derived from crewed flights), `Flights/Queries/GetFlights/`
    (paginated — `PageNumber`/`PageSize` query params, default 1/20, validated 1-100 via
    `GetFlightsQueryValidator`; also supports free-text `Search` (matched case-insensitively
    across origin/destination/aircraft type), `DateFrom`/`DateTo`, exact `OriginICAO`/
    `DestinationICAO`/`AircraftType`, an optional `IsCancelled` tri-state, and `SortBy`
    (`FlightSortField` enum) + `SortDescending`. Filters are ANDed, and **every count in the
    result reflects the filtered set** — global tiles beside a filtered list would mislead, and
    `TotalCount` must match the filtered rows or paging breaks. Sorting always appends `Id` as a
    tiebreaker so pages can't overlap. Search uses `ToLower().Contains` rather than
    `EF.Functions.ILike` because `ILike` lives in the Npgsql package and Application takes no
    provider dependency; returns `FlightsPageResult` with `Items`/`TotalCount`/`ActiveCount`/
    `ThisMonthCount`/`DistinctAircraftTypeCount`; **not cached** — a deliberate choice, see "Background jobs &
    caching". `TotalCount` counts every row `Items` pages through, cancelled flights included, because it is the
    pagination denominator; `ActiveCount`/`ThisMonthCount`/`DistinctAircraftTypeCount` exclude cancelled flights
    so the dashboard tiles agree with `GetStatsQuery`. Don't collapse the two — filtering `TotalCount` breaks
    paging, and unfiltering the tiles makes the dashboard contradict `/admin/stats`),
    `Flights/Events/FlightCreatedEvent` + `FlightCreatedEventHandler` (MediatR notification published after
    a flight is saved; enqueues the METAR Hangfire job), `Flights/Jobs/UpdateFlightMetarJob` (the Hangfire
    job itself — not a MediatR request).
  - `Pilots/Queries/GetPilots/` (cached, `pilots:all`, 5 min), `Pilots/Queries/GetPilotProfile/` (cached,
    `pilot:profile:{id}`, 5 min — hours/currency/recent-flights derived from the pilot's non-cancelled crewed
    flights), `Pilots/Queries/GetPilotLogbook/` (+ CSV/PDF export), `Pilots/Commands/UpdatePilotCertificates/`
    (scopes edits to the caller via `ICurrentUserService`, ignoring any client-supplied pilot id) — no
    standalone create-pilot command outside `Register`.
  - `Stats/Queries/GetStats/` (cached, `stats:all`, 5 min) — dashboard aggregate counts.
  - `Crew/Commands/CreateCrew/` (+ validator: `FlightId`/`PilotId` `NotEmpty` only — **FK existence is checked in
    the handler**, which throws `NotFoundException` → `404`; a validator rule would report a nonexistent
    flight/pilot as `400`. Same reasoning applies to `UpdateFlightCommandValidator` and
    `CreateCRMReportCommandValidator`: none of them do existence lookups. Invalidates `crew:flight:{flightId}`
    and `pilot:profile:{PilotId}`), `Crew/Queries/GetCrewByFlight/` (cached per flight, 5 min).
  - `CRMReports/Commands/CreateCRMReport/` (+ validator: `Title` ≤200, `Description` ≤4000 — `FlightId`
    existence is a handler-side `NotFoundException`, see above;
    invalidates `crmreports:flight:{flightId}` and `stats:all`; resolves `ReporterId` via `ICurrentUserService`
    regardless of `IsAnonymous`, per the accountability note in the Domain section above),
    `CRMReports/Queries/GetCRMReportsByFlight/` (cached per flight, 5 min).
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
  `ApplyConfigurationsFromAssembly`.
- `Persistence/Migrations/`: EF Core migrations live here (in Infrastructure, next to the `DbContext`), not in
  API. Eleven so far, all applied, in order: `InitialCreate` (creates `Flights`, `Pilots`, `Crew`, `CRMReports`),
  `AddPilotAuthFields` (`Pilots.Username` unique, `Pilots.PasswordHash`), `FormalizeNonClusteredIndexes` — this
  one has an **empty `Up()`/`Down()`**, it's a no-op that just records index state already reflected in the
  model snapshot; don't expect a schema diff from it — `AddPilotCertificateExpiry`, `AddFlightCancellation`,
  `AddPilotPasswordReset`, `AddFlightConcurrencyToken`, `AddPilotRefreshToken`,
  `AddAuthLookupIndexesAndNormalizeCredentials`, `AddRefreshTokenSessionTracking` (self-describing; back the
  features documented elsewhere in this file), `AddPilotConcurrencyTokenAndNormalizeLicenseNumber`. Don't
  hardcode this count/list in future edits to this doc —
  check `Persistence/Migrations/` directly, since new migrations land here regularly as features ship. Hangfire
  manages its own Postgres schema independently — no EF migration needed or expected for it.

  **A migration that maps `xmin` must have its generated `Up()`/`Down()` emptied by hand.** `xmin` is a Postgres
  *system* column that already exists on every table, but EF cannot know that and scaffolds an
  `AddColumn<uint>(name: "xmin", ...)`, which Postgres rejects outright (`column name "xmin" conflicts with a
  system column name`). Left in, it fails the startup migration and takes the whole deploy down. This is why
  `AddFlightConcurrencyToken` is empty, and why `AddPilotConcurrencyTokenAndNormalizeLicenseNumber` keeps only
  its licence-number `Sql(...)` — the concurrency-token half is a model-snapshot change and nothing more. That
  `Sql(...)` guards itself with a `DO $$ ... RAISE EXCEPTION` block first: `LicenseNumber` is uniquely indexed,
  so upper-casing two rows that differ only by case would otherwise fail on the constraint with a raw Postgres
  error instead of a sentence explaining what to fix.
- `Identity/JwtTokenGenerator.cs`: implements `IJwtTokenGenerator` — HMAC-SHA256 signed token, claims are
  `NameIdentifier` (Pilot Id), `Name` (Username), `Role` (`Pilot.Rank.ToString()`, e.g. `"Captain"`). Reads
  `Jwt:Key`/`Jwt:Issuer`/`Jwt:Audience`/`Jwt:ExpiryMinutes` from `IConfiguration` directly (same pattern as the
  connection-string read below, not a bound options class shared across layers).
- `ExternalServices/Metar/NoaaMetarService.cs`: implements `IMetarService` against the public NOAA aviation
  weather API. Base URL (`https://aviationweather.gov/`) and a 10s timeout are set where the typed `HttpClient`
  is registered in `DependencyInjection.cs` — **hardcoded, not in `appsettings`**. Calls
  `GET api/data/metar?ids={icao}&format=json`, returns the first observation's raw METAR text or `null` if none.
  **"No observation" is not a failure**: a `404`/`204`, an empty array, and an unparseable `200`
  (HTML error page, unexpected shape) all return `null`, because `UpdateFlightMetarJob` already
  handles null and throwing instead burned all three retries and left a permanently Failed job in
  the dashboard for a nice-to-have enrichment. `5xx`/`429` still throw — those are worth retrying.
- Delete behaviors were chosen deliberately to protect CRM safety data from accidental loss:
  `Crew→Flight` cascades, `Crew→Pilot` and `CRMReport→Flight` restrict, `CRMReport→Reporter` sets null.
- `DependencyInjection.cs`: `AddInfrastructureServices(IConfiguration)` registers `ApplicationDbContext` via
  `UseNpgsql(configuration.GetConnectionString("DefaultConnection"))`, maps `IApplicationDbContext` to it,
  registers `IJwtTokenGenerator -> JwtTokenGenerator`, `AddStackExchangeRedisCache` against
  `ConnectionStrings:Redis`, health checks for both Postgres and Redis, the typed `IMetarService` `HttpClient`,
  and Hangfire (Postgres storage) + `AddHangfireServer()`. Called from `Program.cs` as
  `AddInfrastructureServices(builder.Configuration)`.

**Local dependencies — dedicated containers.** `docker-compose.yml` in the repo root defines the Postgres and
Redis this project runs against, and they belong to this project alone:

```
docker compose up -d      # start both, then run the API
docker compose ps         # both should report (healthy)
docker compose down       # stop, keeping the database volume
docker compose down -v    # stop and DELETE the database
```

**Host ports are deliberately not the defaults** — Postgres is on **5434** and Redis on **6380**, so a
Postgres or Redis already listening on 5432/6379 can never be reached by accident. Changing these ports means
changing `appsettings.Development.json` in the same commit. If a query returns unexpectedly stale or missing
rows, check which port the startup log reports
(`Migrating using database 'altitudelog' on server 'tcp://localhost:5434'`).

**Connection string / secrets convention:** `appsettings.json` holds literal placeholders
(`KENDI_SIFRENIZI_BURAYA_YAZIN`) — it is **not** meant to carry real credentials in a committed file.
`appsettings.Development.json` then overrides `ConnectionStrings:DefaultConnection` and `ConnectionStrings:Redis`
with the compose containers' values. Those are committed on purpose: a container credential that is already
written in `docker-compose.yml` and only works against a container on your own machine is not a secret, and
requiring per-machine setup for it just makes a fresh clone fail to run.

**Do not set `ConnectionStrings:DefaultConnection` in User Secrets.** User Secrets sits *above*
`appsettings.Development.json` in the configuration chain, so a leftover entry there silently wins and the app
talks to whatever it names rather than to the compose containers. Clear it with:

```
dotnet user-secrets remove "ConnectionStrings:DefaultConnection" --project src/AltitudELog.API
```

Real secrets — `Jwt:Key`, the Hangfire dashboard credentials, the SMTP settings — do still live in User
Secrets (`UserSecretsId` set via `dotnet user-secrets init`); see below.

`dotnet ef` commands (migrations, `database update`) read the same configuration and pick up the Development
environment from `launchSettings.json`, so the containers must be up for `database update` to reach the
database — `migrations add` itself doesn't need a live connection (it only diffs the model).

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

`Controllers/AuthController.cs`, all anonymous (a valid access token can't be a precondition for getting one):
`POST /Auth/register` (→ `RegisterCommand`, returns the new Pilot `Guid`, registers with the caller-supplied
`Rank`, defaulting to `Trainee` when omitted), `POST /Auth/login` (→ `LoginCommand`, returns `AuthResponseDto`
with the JWT + refresh token, or `401` on bad credentials via a caught `UnauthorizedAccessException`),
`POST /Auth/forgot-password` / `POST /Auth/reset-password` (→ `ForgotPasswordCommand`/`ResetPasswordCommand`,
both return `204` unconditionally, see the Application section above for the anti-enumeration design),
`POST /Auth/refresh` (→ `RefreshTokenCommand`, rotates and returns a new access+refresh token pair). One
non-anonymous exception: `POST /Auth/logout` (**`[Authorize]`** — needs a valid access token to know whose
refresh token to clear). `Login` carries `[EnableRateLimiting("login")]` (5/min per IP); `Register`,
`ForgotPassword`, `ResetPassword`, and `Refresh` all carry `[EnableRateLimiting("auth")]` (10/min per IP,
looser since these aren't retried in a tight loop the way login is) — both policies configured in `Program.cs`,
`RateLimiting:Login:*`/`RateLimiting:Auth:*`.

### API — Flights, Crew, CRMReports, Pilots, Stats endpoints

**Role gates use `[Authorize(Roles = "Captain,ChiefPilot")]`, never `"Captain"` alone.** `Roles` is an
exact-match list, not a rank hierarchy, so a Captain-only gate locks out `ChiefPilot` — the *higher* rank in
`PilotRank`. The frontend mirrors this through `hasCommandRank` (`frontend/src/routes/ranks.ts`), which
`CaptainRoute`, `CommandRoute`, `Navbar` and `FlightDetailPage` all share; keep the two in step.

- `Controllers/FlightsController.cs`: `POST /Flights` (→ `CreateFlightCommand`, returns the new `Guid`,
  **`[Authorize(Roles = "Captain,ChiefPilot")]`**), `GET /Flights` (→ `GetFlightsQuery`,
  **`[Authorize]`** — any authenticated pilot, not anonymous; paginated via `?pageNumber=&pageSize=`, returns
  `FlightsPageResult`) and `GET /Flights/{id}` (→ `GetFlightByIdQuery`, **`[Authorize]`**),
  `PUT /Flights/{id}` and `POST /Flights/{id}/cancel` (**`[Authorize(Roles = "Captain,ChiefPilot")]`**, throw
  `NotFoundException` → `404` for a nonexistent `FlightId`, see "API — Global exception handling"). Creating a
  flight publishes `FlightCreatedEvent`, which enqueues the METAR-fetch Hangfire job — see "Background jobs &
  caching".
- `Controllers/CrewController.cs`: class-level `[Authorize]`. `POST /Crew` (→ `CreateCrewCommand`,
  **`[Authorize(Roles = "Captain,ChiefPilot")]`** override, tightens the class-level attribute), `GET /Crew/flight/{flightId}`
  (→ `GetCrewByFlightQuery`, any authenticated pilot).
- `Controllers/CRMReportsController.cs`: class-level `[Authorize]`, no extra role restriction. `POST /CRMReports`
  (→ `CreateCRMReportCommand`), `GET /CRMReports/flight/{flightId}` (→ `GetCRMReportsByFlightQuery`) — any
  authenticated pilot can create/read CRM reports.
- `Controllers/PilotsController.cs`, class-level **`[Authorize]`**. Reads split deliberately at the personal-data
  line: `GET /Pilots` (→ `GetPilotsQuery`, used by the frontend's crew-assignment picker) and
  `GET /Pilots/{id}` (→ `GetPilotProfileQuery`) stay open to any authenticated pilot, because currency and
  certificate status are what flight ops need to see about a crewmate. `GET /Pilots/{id}/logbook?format=csv|pdf`
  (→ `GetPilotLogbookQuery`, streamed via `CsvLogbookWriter`/`PdfLogbookWriter`) does **not** — it is the pilot's
  full personal flight record, so it is restricted to the owning pilot or a command rank. **That check lives in
  `GetPilotLogbookQueryHandler`, not the controller**, via `ICurrentUserService.PilotId`/`.Rank` and
  `PilotRankPolicy.IsCommandRank`, and throws `ForbiddenAccessException` → `403`. It runs *before* the pilot
  lookup, so a 403 never doubles as an existence oracle. `PUT /Pilots/me/certificates`
  (→ `UpdatePilotCertificatesCommand`, scoped to the caller via `ICurrentUserService` — the command has no
  pilot-id field a client could tamper with).
- `Controllers/StatsController.cs`: `GET /Stats` (→ `GetStatsQuery`, **`[Authorize(Roles = "Captain,ChiefPilot")]`**)
  — dashboard aggregate counts for the frontend's `AdminStatsPage`, matching its `CommandRoute` gating.

All controllers go through `IMediator.Send`, no direct Application/Infrastructure calls. Sample requests in
`AltitudELog.API.http`.

Every action carries `[ProducesResponseType]` for the statuses it can actually return, with the
shared ones (`400` `ValidationProblemDetails`, `401`, `429` on `Auth`) declared once at class
level, plus a `<summary>` XML comment. `GenerateDocumentationFile` is on in
`AltitudELog.API.csproj` (with `1591` suppressed) so those summaries reach the OpenAPI document.
This matters more than usual here because the document is served publicly through Scalar on the
live deployment — it is the API's contract to anyone reading it, so keep new endpoints annotated.

### API — Global exception handling

`Common/DomainExceptionHandler.cs` and `Common/ValidationExceptionHandler.cs`, registered via
`AddExceptionHandler<T>()` (in that order: Validation, then Domain) + `AddProblemDetails()`, activated by
`app.UseExceptionHandler()`. Mapping: `FluentValidation.ValidationException` → `400` with a
`ValidationProblemDetails` per-field error shape, `UnauthorizedAccessException` → `401`,
`AltitudELog.Application.Common.Exceptions.ForbiddenAccessException` → `403` (authenticated, but not allowed
*this* resource — re-authenticating would not help, which is what separates it from the 401 above),
`AltitudELog.Application.Common.Exceptions.NotFoundException` → `404`, `InvalidOperationException` → `409`
(reserved for genuine conflicts — duplicate crew assignment, duplicate username, mutating an already-cancelled
flight; "does not exist" cases should throw `NotFoundException` instead, not `InvalidOperationException`),
`DbUpdateConcurrencyException` → `409` with a friendly "modified by another request" detail (EF's own message
is too raw to surface) — see the `Flight` `xmin` concurrency token below. Anything unmapped falls through to the
default ASP.NET Core `ProblemDetails` `500` response. The frontend's `ApiError`/`toApiError`
(`frontend/src/lib/axios.ts`) is written against this exact shape.

### API — CORS, health checks, Hangfire dashboard

- CORS: a single named policy `FrontendCorsPolicy` (`Program.cs`), origins read from config key
  `Cors:AllowedOrigins` (an array), falling back to `["http://localhost:5180"]` if unset (matches
  `frontend/vite.config.ts`'s `server.port = 5180` with `strictPort: true`), `AllowAnyHeader()` +
  `AllowAnyMethod()`, no `AllowCredentials()`. `UseCors()` runs before `UseAuthentication()`/`UseAuthorization()`
  in the pipeline. If the frontend dev port ever changes, the fallback origin must be updated to match.
  In production this is set via the Railway env var `Cors__AllowedOrigins__0` =
  `https://altitudelog.vercel.app` (double-underscore is ASP.NET Core's env-var array-binding
  convention). `Program.cs` **fails fast at startup** (throws before `app.Run()`, same pattern as
  the `Jwt:Key` check) if running in the `Production` environment with `Cors:AllowedOrigins` unset —
  this exists so an accidentally-deleted/renamed Railway var breaks the deploy loudly instead of
  silently CORS-blocking the live Vercel frontend. The integration test factory
  (`tests/AltitudELog.IntegrationTests/Infrastructure/IntegrationTestWebAppFactory.cs`) configures
  `Cors:AllowedOrigins:0` explicitly for this reason — `WebApplicationFactory` hosts default to the
  `Production` environment name since no `ASPNETCORE_ENVIRONMENT` is set for the test process.
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
`flight.METARInfo` if a result came back, and saves. This means a newly created flight's METAR is **not**
present in the `POST /Flights` response — it appears asynchronously once the job runs, and since
`GetFlightsQuery` isn't cached (see below), the next `GET /Flights` sees it immediately.
`UpdateFlightMetarJob` carries `[AutomaticRetry(Attempts = 3)]` (Hangfire's default is 10 with exponential
backoff) — bounded because a transient NOAA API failure shouldn't keep retrying this non-critical enrichment
job for days; once attempts are exhausted the job shows as Failed in the `/hangfire` dashboard rather than
being silently dropped.

**`GetFlightsQuery` is deliberately not cached.** It used to be (a single `flights:all` key, whole dataset),
but once the query became paginated (`PageNumber`/`PageSize`), caching would require either a per-page cache
key — which `IDistributedCache` can't bulk-invalidate on write (no wildcard delete) — or a version-counter
indirection. Given page payloads are small, the simplicity/always-fresh-data tradeoff was chosen over
re-introducing caching here; revisit with a version-counter key if profiling ever shows this query is hot.

**Redis caching** (all via `ICacheableQuery`/`ICacheInvalidatorCommand`, all 5-minute absolute expiry):

| Query | Cache key | Invalidated by |
|---|---|---|
| `GetPilotsQuery` | `pilots:all` | `RegisterCommand` |
| `GetStatsQuery` | `stats:all` | `RegisterCommand`, `CreateFlightCommand`, `UpdateFlightCommand`, `CancelFlightCommand`, `CreateCRMReportCommand`, `UpdatePilotCertificatesCommand` |
| `GetPilotProfileQuery(pilotId)` | `pilot:profile:{pilotId}` | `CreateCrewCommand`, `UpdateFlightCommand`, `CancelFlightCommand` (for every pilot crewed on the affected flight), `UpdatePilotCertificatesCommand` (the caller's own profile) |
| `GetCrewByFlightQuery(flightId)` | `crew:flight:{flightId}` | `CreateCrewCommand` (same flight only) |
| `GetCRMReportsByFlightQuery(flightId)` | `crmreports:flight:{flightId}` | `CreateCRMReportCommand` (same flight only) |

Both caching pipeline behaviors are **fail-open**: if Redis is unreachable, the request still succeeds (served
from/written straight to Postgres, cache step skipped with a logged warning) rather than the API returning a
`500`. This is deliberate — verify it still holds if you touch `CachingBehavior`/`CacheInvalidationBehavior`.

For local dev, both Postgres and Redis need to actually be running (`docker compose up -d` — see "Local
dependencies — dedicated containers" above) for the full feature set (and for
`dotnet test` at the solution level, since `AltitudELog.IntegrationTests` spins up its own Postgres 17 + Redis
Alpine via Testcontainers, which requires Docker to be running). Missing Redis degrades gracefully (see above);
missing Postgres does not (Postgres is not optional — EF Core, Hangfire storage, and health checks all depend on
it being reachable).

## Frontend (`frontend/`)

React 19 + TypeScript + Vite 8 + Tailwind CSS 4 SPA, talking to the API over `axios`. Not part of the .NET
solution/build — it's a separate `npm` project.

- `src/pages/`: `LandingPage` (public marketing page at `/`), `LoginPage`, `RegisterPage`,
  `ForgotPasswordPage`, `ResetPasswordPage`, `DashboardPage` (flight list, at `/dashboard`),
  `FlightDetailPage` (crew + CRM report tabs), `CreateFlightPage`/`EditFlightPage` (Captain-only),
  `PilotProfilePage`, `AdminStatsPage`, `UnauthorizedPage`, `NotFoundPage`.
- `src/routes/`: `ProtectedRoute` (redirects to `/login` if not authenticated), `CaptainRoute` (redirects to
  `/unauthorized` unless `rank === 'Captain'`), `CommandRoute` (same, but for `rank === 'Captain' ||
  rank === 'ChiefPilot'`) — mirror the API's role-based `[Authorize(Roles = "...")]` gates on the corresponding
  routes in `src/router.tsx`.
- `src/store/authStore.ts`: `zustand` store (persisted to `localStorage` under the `altitudelog-auth` key) holding
  the JWT, refresh token, pilot id, username, rank — see the localStorage token-storage note in "Project state"
  above.
- `src/lib/axios.ts`: single `apiClient` instance, attaches the bearer token from the auth store on every
  request. On a `401` from an authenticated request, attempts a single refresh (via a separate bare `axios`
  call that bypasses the interceptor, to avoid an infinite loop) with an in-flight-promise lock so concurrent
  401s share one refresh instead of racing; on success the store is updated and the original request retried
  once, on failure it auto-logs-out and redirects to `/login`. Normalizes error responses into the `ApiError`
  shape matching the API's `ProblemDetails`/`ValidationProblemDetails` output.
- `src/services/`: one thin service module per backend resource (`authService`, `flightService`, `crewService`,
  `crmReportService`, `pilotService`), all going through `apiClient`.

### Frontend — the video ground

**Every route in the app runs on one fixed background clip**, `public/videos/air-backdrop.mp4` ("Air 1"), via
`src/components/common/VideoBackdrop.tsx`. It is mounted once per document — by `LandingPage`, by `AppLayout`
(covering every signed-in page), and by `AuthCardLayout` and `NotFoundPage`. Login and Register are the one
exception: they run `air-auth.mp4` ("Air 2") instead, as the left three quarters of a split layout.

**The clip is shown exactly as shot — no wash, no scrim, no grade — and this is load-bearing, not taste.** The
landing page previously layered a `bg-black-void/35` wash, dark gradient scrims on two sections and three
80%-opaque section grounds over it, which made the page read as dark at the top and washed the footage out
progressively on the way down. All of that is deleted. Anything that tints a *stretch of page* makes the clip
read at a different strength in that stretch, which is the specific defect this replaced. Do not re-introduce
one without an explicit go-ahead.

Legibility therefore comes from the clip being uniformly bright — a golden-hour sky running roughly `#a8c8e0`
to `#f7f0e8` — carrying dark type at 9:1 or better on every frame. The landing palette lives in the
`.air-page` block in `src/index.css` (`--air-fg`, `--air-fg-muted`, `--air-rule`, `--air-accent`), and every
one of those four values was derived against the clip's *worst* band — its peach highlights — rather than
against its average, measuring `#14213d` at 11.3:1, `#33405c` at 7.5:1 and `#1a4fa0` at 5.9:1. `--air-accent`
is a deepened Signal Blue because the `--color-signal-blue` token's own `#2b7fff` measures only 2.86:1 on the
same band. If the clip
is ever swapped for a darker one, those four values are what has to be re-derived — a scrim is not the answer.

Two surface treatments are allowed to cover the footage, both in `index.css`: `.air-nav` (the landing bar,
transparent over the hero, a light veil once scrolled) and `.air-surface` (near-opaque, for auth forms and the
404 — small dense text is the one thing no scrim can make safe over moving footage). Inside the application,
`Card` is 90% opaque and the `Navbar`/`Footer` are 72% with a blur, so the sky reads in the gutters and
between panels. `src/pages/LandingPage.test.tsx` guards the one-ground rule.

- `src/components/landing/`: `LandingNav`, `HeroSection`, `FeatureBlock`, `CapabilityGrid`, `LandingFooter`,
  `Reveal` (framer-motion `whileInView`), `ctas.ts` (the two shared button treatments), plus the 3D layer.
  **`SculptureLayer` + `AirbusModel` are mounted only by `LandingPage`** — no other route renders a WebGL
  canvas, and the ~600kB of three/R3F plus the 2.5MB GLB are lazy-imported so the signed-in app never pays for
  them. `AirbusModel` is gated on WebGL support and `min-width: 768px`, wrapped in an error boundary (a model
  failure must cost only the model), tints the near-white airframe toward a cool steel so it does not vanish
  against cloud, and drives its flight path from a *damped* scroll value rather than from `window.scrollY`
  directly — see `SCROLL_FOLLOW`. Its Suspense boundary must stay **inside** `<Canvas>`; moving it out unmounts
  the renderer mid-load and leaves a dead context. The GLB is meshopt-compressed (2.5MB against 8.8MB
  uncompressed) and its decoder is WebAssembly, which is why `index.html`'s CSP `script-src` carries
  `'wasm-unsafe-eval'` — that token permits WebAssembly compilation only and still refuses `eval()`/
  `new Function()`, so do not widen it to `'unsafe-eval'`.
- `src/components/layout/`: `AppLayout` (signed-in shell), `AuthSplitLayout` (Login/Register — Air 2 on the left
  three quarters, form panel on the right quarter with a 380px floor so the fields stay usable below ~1520px),
  `AuthCardLayout` (forgot/reset — same clip, centred card), `Navbar`, `Footer`.
- `src/components/ui/`: shared primitives (`Button`, `Card`, `Input`, `Select`, `Combobox`, `Badge`, `Skeleton`,
  `Eyebrow`, `StatTile`, `RouteRibbon`, `Pagination`, `CrmTrendChart`), plus `AuthField`/`AuthSelect`
  — deliberately separate from `Input`/`Select`, which stay boxed for dense operational forms while the auth
  controls use a soft fill and a hairline that appears on focus. The application's own palette is navy ink on
  cool light surfaces (the `--color-*` tokens at the top of `index.css`); the `--color-whiteout`/
  `twilight-blue`/`signal-blue` "Air" tokens below them serve the landing page and the signed-in accents.
  Radii come from the `--radius-*` scale, which centres on `0.5rem`/8px (`--radius`, `-md` and `-lg` are all
  8px); hairlines rather than shadows. Keep new UI on these primitives and tokens rather than one-off styling
  in pages.
- **Deploys run from the repo root, and `.vercelignore` there is load-bearing.** The Vercel project's Root
  Directory is `frontend`, so `vercel deploy --prod` is issued from the repo root. **`.gitignore` does not
  filter that upload** — measured, the CLI shipped 2612 files against 2633 present on disk, 2294 of them
  gitignored. Anything that must stay out of the build context belongs in `.vercelignore`, not only in
  `.gitignore`. That is how a previous local build (`frontend/dist`) reached the context, and Tailwind v4 —
  which auto-detects its sources by walking the project — scanned that stale bundle and harvested class-like
  tokens out of it: `visible`, `contents`, `table`, `shrink`, `shadow`, `ring`, `blur`, `ease-*` and their
  `!important` variants, 14 utilities nothing uses, +2.5kB, and production CSS no longer reproducible from a
  clean checkout. Established by bisection, not inspection: identical output on Windows and in a Linux
  container, unchanged with `.git` absent and with the build cache skipped on a fresh install, and back to the
  reproducible hash the moment `frontend/dist` left the upload — so a Tailwind version drift (pinned 4.3.3 both
  sides) and a platform difference were both ruled out first. The file also drops the .NET half of the repo,
  which the frontend build never reads: 2612 files to 251, of which 2043 were `bin`/`obj` compiler output.
  Its `/src` and `/tests` lines are what keep that output away now — `.gitignore` is not doing it.
- Config: `frontend/.env.development` sets `VITE_API_BASE_URL=http://localhost:5264` (must match the API's http
  launch profile). `vite.config.ts` pins the dev server to port `5180` with `strictPort: true` — this exact port
  is what the API's CORS policy allows; changing it requires updating `Program.cs` too.

Commands (run from `frontend/`): `npm install`, `npm run dev` (Vite dev server, port 5180),
`npm run build` (`tsc -b && vite build`), `npm run lint` (`oxlint`), `npm test` (`vitest run`), `npm run preview`.

## Commands

Run all commands from the repo root against the solution file, or use `--project src/AltitudELog.API` for the API
specifically.

- Restore: `dotnet restore`
- Build: `dotnet build AltitudELog.slnx`
- Run (http profile, `http://localhost:5264`): `dotnet run --project src/AltitudELog.API --launch-profile http`
- Run (https profile, `https://localhost:7240`): `dotnet run --project src/AltitudELog.API --launch-profile https`
- OpenAPI document is always mapped (not Development-gated, so it's explorable on the live deployment too),
  served via `AddOpenApi()`/`MapOpenApi()` and browsable through Scalar (`MapScalarApiReference()`) — there is
  no Swagger UI wired up.
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
- CI: `.github/workflows/ci.yml` runs two jobs on push/PR — `backend` (build → **dependency audit** → `dotnet test`
  with `--collect:"XPlat Code Coverage"`, uploaded as a `coverage` artifact) and `frontend`
  (`npm run build`, `npm run lint`, `npm test`). The audit step pins `DOTNET_CLI_UI_LANGUAGE: en` on purpose: it
  decides pass/fail by grepping `dotnet list package --vulnerable` output, and that string is localised, so a
  runner in another locale would silently always pass. `.github/dependabot.yml` opens weekly NuGet/npm and
  monthly actions update PRs, **minor and patch only** — every ecosystem carries an explicit
  `version-update:semver-major` ignore. That is not tidiness: without it Dependabot proposes each major on its
  own (grouping only covers the update-types it names), and the first run duly opened
  "Bump MediatR from 12.4.1 to 14.2.0" — precisely the bump the licence note above forbids. Majors stay a
  manual, considered change.
- **Style is enforced by the build, not by a formatter.** `.editorconfig` + `Directory.Build.props`
  (`EnforceCodeStyleInBuild` + `TreatWarningsAsErrors`) means an IDE0xxx violation fails `dotnet build`. Two
  carve-outs, both deliberate: EF Core writes migrations from its own template (block-scoped namespaces and
  all), so `src/AltitudELog.Infrastructure/Persistence/Migrations/**.cs` is marked `generated_code = true` —
  otherwise every new migration would fail the build; and `WarningsNotAsErrors` exempts `NU1901`-`NU1904`,
  because a newly published advisory against an existing transitive would otherwise turn a green commit red
  with nothing changed here. The CI audit step is the deliberate gate for those instead. A `csharpier` tool
  manifest used to sit at the repo root; it was never wired into CI and 133 of 186 files did not satisfy it, and
  its output was not more readable than the hand formatting — it was removed rather than adopted.
- **Three top-level `PackageReference`s exist only to raise a vulnerable transitive dependency, and none of
  them is imported by any `.cs` file** — deleting one because "nothing uses it" silently reintroduces a high
  severity advisory:
  - `AltitudELog.API` → `Microsoft.OpenApi` 2.11.0, over `Microsoft.AspNetCore.OpenApi`'s 2.0.0.
  - `AltitudELog.Application` → `Newtonsoft.Json` 13.0.3, over `Hangfire.Core`'s 11.0.1 (GHSA-5crp-9r3c-p9vr).
  - `AltitudELog.IntegrationTests` → `SSH.NET` 2026.0.0, over Testcontainers → `Docker.DotNet.Enhanced`'s
    2025.1.0 (GHSA-q939-rpr3-3284).

  `dotnet list AltitudELog.slnx package --vulnerable --include-transitive` should report all six projects
  clean; re-run it when package versions move rather than assuming this stays fixed.

## Architecture notes

- Hosting model in `AltitudELog.API/Program.cs` (top-to-bottom, order is load-bearing throughout):
  bootstrap Serilog logger (console-only, for startup failures) → `builder.Host.UseSerilog(...)` (full config-
  driven logging) → `AddControllers()` (with `JsonStringEnumConverter`, matching the `HasConversion<string>()` DB
  storage) → `AddOpenApi()` → `AddApplicationServices()` + `AddInfrastructureServices()` → `AddHttpContextAccessor()`
  + `AddScoped<ICurrentUserService, CurrentUserService>()` → `AddExceptionHandler<ValidationExceptionHandler>()` +
  `AddExceptionHandler<DomainExceptionHandler>()` + `AddProblemDetails()` → `AddCors("FrontendCorsPolicy")` →
  `AddAuthentication().AddJwtBearer(...)` (with `ClockSkew = TimeSpan.Zero` — the default is a **5-minute**
  grace, which would keep an expired access token working long past its stated `expiresAtUtc` and undercut the
  short-lived-access-token half of the refresh design) + `AddAuthorization()` (plain, no named policies — role
  checks are all inline `[Authorize(Roles = "...")]`) → `AddRateLimiter(...)` (the `"login"` and `"auth"`
  fixed-window policies, whose `OnRejected` writes a `ProblemDetails` `429` and a `Retry-After` header taken
  from the lease's `MetadataName.RetryAfter`,
  see "API — Auth endpoints") → `builder.Build()` → **fail-fast Jwt:Key length/presence check** (throws before
  the app starts serving) → apply pending EF Core migrations on startup with a bounded retry loop (10 attempts,
  3s apart — tolerates a managed Postgres, e.g. Railway, being briefly unready right after container start,
  without crash-looping) → `MapOpenApi()` + `MapScalarApiReference()` (both unconditional, not dev-gated, so
  the live deployment is explorable too — there is no Swagger UI, Scalar is the API explorer) →
  `UseForwardedHeaders()` (needed for the rate limiter's per-IP partitioning to see the real client IP behind a
  platform proxy — see "Forwarded headers" below) → `UseExceptionHandler()` → `UseSerilogRequestLogging()` → `UseHttpsRedirection()`
  (Development-only — TLS is terminated by the platform proxy in production) → `UseCors("FrontendCorsPolicy")`
  → `UseAuthentication()` → `UseAuthorization()` → `UseRateLimiter()` → `MapControllers()` →
  `MapHealthChecks("/health", ...)` → `UseHangfireDashboard("/hangfire", ...)`. `UseAuthentication()` must
  precede `UseAuthorization()`; `UseCors()` must precede both.
- **Startup failures must exit non-zero.** The top-level `try/catch` around the whole of `Program.cs` sets
  `Environment.ExitCode = 1` in its `catch`. Without that, the fail-fast guards (`Jwt:Key`, production
  `Cors:AllowedOrigins`, exhausted migration retries) log `Fatal` and then exit **0**, so Railway/Docker/CI
  report a successful deploy for an app that never served a request. Don't remove it.
- **Forwarded headers.** `ForwardedHeadersOptions` sets `ForwardLimit = 1` and only clears
  `KnownIPNetworks`/`KnownProxies` when `ForwardedHeaders:TrustAnyProxy` is true (default **false**, committed in
  `appsettings.json`). Clearing them makes `X-Forwarded-For` trusted from any peer, and since the rate-limit
  policies partition on the resulting `RemoteIpAddress`, anyone able to reach the app directly could rotate the
  header per request for an unlimited supply of login buckets. The live Railway deployment therefore needs
  `ForwardedHeaders__TrustAnyProxy=true`; without it `Program.cs` logs a startup warning in Production and every
  client behind the proxy shares one rate-limit partition. `tests/AltitudELog.IntegrationTests/Auth/
  RateLimitSpoofingTests.cs` guards this (`RateLimitTestWebAppFactory` injects a concrete `RemoteIpAddress`,
  because `TestServer` leaves it null and the middleware then skips its known-proxy check entirely).
- `QuestPDF.Settings.License = LicenseType.Community` is set once at startup, before the host is built — the
  PDF logbook export (`PdfLogbookWriter`) uses QuestPDF, Community-licensed the same revenue-gated way as
  MediatR above.
- Controllers live under `AltitudELog.API/Controllers/` and use attribute routing (`[Route("[controller]")]`).
- `Nullable` and `ImplicitUsings` are enabled across all projects (including both test projects) — new code
  should follow nullable-reference-type conventions rather than disabling them.

  ## Development Guidelines & Token-Saving Rules

- **No Conversational Filler**: Respond directly, omitting greetings, apologetic language, or verbose explanations.
- **Surgical File Access**: Do NOT read entire directories. Ask for explicit file targets or use exact `@filename` references to minimize context bloat.
- **Plan Mode First**: Always enter `Plan Mode` for any task requiring >2 steps. Propose changes, list specific files to modify, and wait for confirmation before writing code.
- **Quiet Verification**: Before declaring a task complete, verify with `dotnet build AltitudELog.slnx` using minimal logs.

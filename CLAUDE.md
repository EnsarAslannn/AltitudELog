# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is being migrated from a default ASP.NET Core Web API scaffold to a **Clean Architecture + CQRS** solution,
targeting .NET 10, for an aviation flight/CRM logging domain (pilots, flights, crew assignments, CRM reports).
The migration is happening in stages. So far: the project/layer skeleton, Domain entities + Fluent API
configurations, a first MediatR/CQRS vertical slice (`Flight` create + list), a real **PostgreSQL** database
(with applied `InitialCreate` and `AddPilotAuthFields` migrations), and **JWT authentication** (Register/Login for
`Pilot`, `POST /Flights` protected via `[Authorize]`) all exist and work end-to-end. There is **no CQRS for
`Pilot`/`Crew`/`CRMReport` beyond auth yet, no validation, no role-based authorization policies** — do not assume
any of those exist, and do not add them without an explicit go-ahead for that stage.

## Solution structure

```
AltitudELog.slnx                        # .NET 10 SDK's XML-based solution format (successor to .sln)
src/
  AltitudELog.API/            # ASP.NET Core host: controllers, Program.cs, appsettings
  AltitudELog.Domain/         # Entities, no dependencies on other layers
  AltitudELog.Application/    # CQRS (commands/queries), depends on Domain only
  AltitudELog.Infrastructure/ # EF Core / persistence / external services, depends on Application
```

Dependency direction (enforce this — don't add references that point the other way):
`API → Application, Infrastructure` · `Infrastructure → Application` · `Application → Domain` · `Domain → (nothing)`.
`Infrastructure` reaches `Domain` only transitively through `Application` — do not add a direct
`Infrastructure → Domain` project reference.

### Domain (`src/AltitudELog.Domain`)

Plain POCOs, no package or project references (not even EF Core) — keep it that way.

- `Entities/`: `Pilot`, `Flight`, `Crew`, `CRMReport`. All use `Guid` ids.
  - `Pilot` doubles as the auth identity — it carries `Username` and `PasswordHash` directly (no separate `User`
    entity/table). `Rank` is embedded as the JWT role claim on login, so a pilot's rank *is* their authorization role.
  - `Crew` is an explicit join entity between `Flight` and `Pilot` (not an EF Core implicit skip-navigation) — it
    carries a flight-specific `DutyRole`, separate from `Pilot.Rank` (a pilot's general rank vs. their role on one
    particular flight can differ).
  - `CRMReport.ReporterId` (nullable FK to `Pilot`) is tracked even when `IsAnonymous` is true — anonymity is
    enforced at the application/presentation layer, not by omitting the data. This is intentional for
    accountability/audit purposes.
- `Enums/`: `PilotRank`, `DutyRole`, `SeverityLevel`.

### Application (`src/AltitudELog.Application`)

- References `MediatR` (pinned to **12.4.1** — MediatR v13+ requires a commercial license from Lucky Penny
  Software above a revenue threshold; 12.x and earlier stay Apache 2.0/MIT. Do not bump past 12.x without
  re-confirming the license situation), `Microsoft.EntityFrameworkCore` (core package only, for `DbSet<T>`/
  `IQueryable` — no provider dependency here), and `Microsoft.Extensions.Identity.Core` (for `PasswordHasher<Pilot>`
  only — not the full ASP.NET Core Identity system, no `IdentityDbContext`/stores).
- `Common/Interfaces/IApplicationDbContext.cs`: the persistence abstraction Application codes against, instead of
  a concrete `DbContext`. Exposes `DbSet<Flight> Flights` and `DbSet<Pilot> Pilots` — extend it per-entity as new
  features need them, don't add speculative `DbSet`s ahead of use.
- `Common/Interfaces/IJwtTokenGenerator.cs`: abstraction for JWT issuance (`GenerateToken(Pilot) -> (Token,
  ExpiresAtUtc)`), implemented in Infrastructure so Application stays free of `System.IdentityModel.Tokens.Jwt`.
- Feature folders under vertical slices, not by technical layer — e.g. `Flights/Commands/CreateFlight/`,
  `Flights/Queries/GetFlights/`, `Auth/Commands/Register/`, `Auth/Commands/Login/`. Each command/query, its
  handler, and any feature-specific DTO live together.
- `DependencyInjection.cs`: `AddApplicationServices()` registers MediatR against this assembly. Called from
  `Program.cs`.

### Infrastructure (`src/AltitudELog.Infrastructure`)

- References `Microsoft.EntityFrameworkCore` + `Microsoft.EntityFrameworkCore.Relational` +
  **`Npgsql.EntityFrameworkCore.PostgreSQL`** (10.0.3) — PostgreSQL is the real, chosen provider (no more
  InMemory placeholder) — plus `System.IdentityModel.Tokens.Jwt` for JWT issuance.
- `Persistence/Configurations/`: one `IEntityTypeConfiguration<T>` per entity (`PilotConfiguration`,
  `FlightConfiguration`, `CrewConfiguration`, `CRMReportConfiguration`). Enums are stored as strings
  (`HasConversion<string>()`) for DB readability. `PilotConfiguration` also enforces a unique index on `Username`,
  same pattern as the existing `LicenseNumber` unique index.
- `Persistence/ApplicationDbContext.cs`: implements `IApplicationDbContext`, applies all configurations via
  `ApplyConfigurationsFromAssembly`. `Crew` and `CRMReport` have no explicit `DbSet` on the interface — still part
  of the EF model through `Flight`'s navigation properties.
- `Persistence/Migrations/`: EF Core migrations live here (in Infrastructure, next to the `DbContext`), not in
  API. `InitialCreate` creates `Flights`, `Pilots`, `Crew`, `CRMReports`; `AddPilotAuthFields` adds
  `Pilots.Username` (unique) and `Pilots.PasswordHash`. Both applied.
- `Identity/JwtTokenGenerator.cs`: implements `IJwtTokenGenerator` — HMAC-SHA256 signed token, claims are
  `NameIdentifier` (Pilot Id), `Name` (Username), `Role` (`Pilot.Rank.ToString()`, e.g. `"Captain"`). Reads
  `Jwt:Key`/`Jwt:Issuer`/`Jwt:Audience`/`Jwt:ExpiryMinutes` from `IConfiguration` directly (same pattern as the
  connection-string read below, not a bound options class shared across layers).
- Delete behaviors were chosen deliberately to protect CRM safety data from accidental loss:
  `Crew→Flight` cascades, `Crew→Pilot` and `CRMReport→Flight` restrict, `CRMReport→Reporter` sets null.
- `DependencyInjection.cs`: `AddInfrastructureServices(IConfiguration)` registers `ApplicationDbContext` via
  `UseNpgsql(configuration.GetConnectionString("DefaultConnection"))`, maps `IApplicationDbContext` to it, and
  registers `IJwtTokenGenerator -> JwtTokenGenerator`. Called from `Program.cs` as
  `AddInfrastructureServices(builder.Configuration)`.

**Connection string / secrets convention:** `appsettings.json`'s `ConnectionStrings:DefaultConnection` holds a
literal placeholder password (`KENDI_SIFRENIZI_BURAYA_YAZIN`) — it is **not** meant to be a real credential in a
committed file. The real local password lives in .NET User Secrets for the API project (`UserSecretsId` set via
`dotnet user-secrets init`), which overrides the same config key at runtime. To point a fresh dev machine at a
different local Postgres password, run:

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

### API — Auth endpoints

`Controllers/AuthController.cs`: `POST /Auth/register` (→ `RegisterCommand`, returns the new Pilot `Guid`),
`POST /Auth/login` (→ `LoginCommand`, returns `AuthResponseDto` with the JWT, or `401` on bad credentials via a
caught `UnauthorizedAccessException`). Both anonymous — registering/logging in obviously can't require a token.

### API — Flights endpoints

`Controllers/FlightsController.cs`: `POST /Flights` (→ `CreateFlightCommand`, returns the new `Guid`, requires
`[Authorize]` — any authenticated Pilot, no role restriction yet), `GET /Flights` (→ `GetFlightsQuery`, returns
`List<FlightDto>`, anonymous). Both go through `IMediator.Send`, no direct Application/Infrastructure calls from
the controller. Sample requests in `AltitudELog.API.http`.

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

There is no test project yet; there's nothing to run with `dotnet test` until one is added.

Known pre-existing issue: `dotnet build`/`dotnet restore` emits an NU1903 advisory for `Microsoft.OpenApi` 2.0.0
(transitive via `Microsoft.AspNetCore.OpenApi`) — a known high-severity vulnerability upstream, not something
introduced by this repo's code. Worth revisiting when bumping package versions.

## Architecture notes

- Minimal hosting model in `AltitudELog.API/Program.cs`: builder → `AddControllers()` (with a
  `JsonStringEnumConverter` so enum request/response bodies use string names like `"Captain"`, matching the
  `HasConversion<string>()` DB storage) + `AddOpenApi()` + `AddApplicationServices()` +
  `AddInfrastructureServices()` + `AddAuthentication().AddJwtBearer(...)` + `AddAuthorization()` → build →
  conditional `MapOpenApi()` in Development → `UseHttpsRedirection()` → `UseAuthentication()` →
  `UseAuthorization()` → `MapControllers()`. `UseAuthentication()` must precede `UseAuthorization()` — order is
  load-bearing.
- Controllers live under `AltitudELog.API/Controllers/` and use attribute routing (`[Route("[controller]")]`).
- `Nullable` and `ImplicitUsings` are enabled across all four projects — new code should follow nullable-reference-type
  conventions rather than disabling them.

  ## Development Guidelines & Token-Saving Rules

- **No Conversational Filler**: Respond directly, omitting greetings, apologetic language, or verbose explanations.
- **Surgical File Access**: Do NOT read entire directories. Ask for explicit file targets or use exact `@filename` references to minimize context bloat.
- **Plan Mode First**: Always enter `Plan Mode` for any task requiring >2 steps. Propose changes, list specific files to modify, and wait for confirmation before writing code.
- **Applied Learning (<15 words)**: On any correction, append the lesson to `tasks/lessons.md` using a single line (max 15 words) to avoid repeating mistakes.
- **Quiet Verification**: Before declaring a task complete, verify with `dotnet build AltitudELog.slnx` using minimal logs.

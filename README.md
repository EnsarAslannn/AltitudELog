# AltitudELog

[![CI](https://github.com/EnsarAslannn/AltitudELog/actions/workflows/ci.yml/badge.svg)](https://github.com/EnsarAslannn/AltitudELog/actions/workflows/ci.yml)

AltitudELog is an aviation flight and CRM (Crew Resource Management) logging system. It lets pilots register
with a rank, log flights, assign crew to those flights with per-flight duty roles, and file CRM safety reports
(optionally anonymous) tied to a specific flight. Flight weather is enriched automatically after creation via a
background job that fetches the METAR report for the flight's departure airport.

**Live demo:** [altitudelog.vercel.app](https://altitudelog.vercel.app) (frontend) — backed by a .NET API on
Railway. Register with any rank, including **Captain**, to unlock flight-creation.

## Tech stack

**Backend**
- .NET 10, ASP.NET Core Web API
- Clean Architecture (Domain / Application / Infrastructure / API) + CQRS via MediatR
- PostgreSQL (EF Core, Npgsql provider)
- Redis (distributed query caching)
- Hangfire (Postgres-backed background jobs)
- FluentValidation, Serilog, JWT bearer auth, health checks

**Frontend**
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand (state), Axios (API client), React Router

## Engineering highlights

- **CQRS pipeline**: every command/query flows through an ordered MediatR pipeline —
  `ValidationBehavior` (FluentValidation, short-circuits on invalid input) → `CachingBehavior` →
  `CacheInvalidationBehavior` (Redis, fail-open: a down cache degrades gracefully instead of 500ing).
- **Role-based authorization**: a pilot's `Rank` doubles as their JWT role claim — flight/crew *writes* are
  gated to `Captain` (`[Authorize(Roles = "Captain")]`), mirrored on the frontend with route guards.
- **Async background processing**: creating a flight publishes a domain event that enqueues a Hangfire job to
  fetch and attach the METAR weather report for the flight's airport, decoupling the write path from an
  external API call.
- **Testcontainers-backed integration tests**: the integration test suite spins up real Postgres 17 and Redis
  containers per run rather than mocking the persistence layer.
- **Global exception handling**: a `ProblemDetails`-based pipeline maps validation failures to `400`,
  unauthorized access to `401`, missing resources to `404`, and conflicts to `409`, giving the frontend a
  single consistent error shape.
- **Containerized deployment**: a multi-stage `Dockerfile` (SDK build stage → ASP.NET runtime stage) ships the
  API to Railway; the frontend deploys separately to Vercel.

## Solution structure

```
AltitudELog.slnx                        # .NET 10 SDK's XML-based solution format
src/
  AltitudELog.API/            # ASP.NET Core host: controllers, Program.cs, appsettings
  AltitudELog.Domain/         # Entities (Pilot, Flight, Crew, CRMReport) — no external dependencies
  AltitudELog.Application/    # CQRS commands/queries, validators, caching abstractions
  AltitudELog.Infrastructure/ # EF Core persistence, JWT issuance, Redis, Hangfire, METAR client
tests/
  AltitudELog.Application.UnitTests/  # Handler/validator unit tests (xUnit + NSubstitute, EF Core InMemory)
  AltitudELog.IntegrationTests/       # WebApplicationFactory + Testcontainers (Postgres, Redis)
frontend/                     # React + TypeScript + Vite SPA (separate npm project)
```

Dependency direction: `API → Application, Infrastructure` · `Infrastructure → Application` ·
`Application → Domain` · `Domain → (nothing)`.

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 22+ and npm
- PostgreSQL (local instance)
- Redis (local instance — the API degrades gracefully without it, but caching won't work)
- Docker (only required to run the integration test suite, which uses Testcontainers)
- [`dotnet-ef`](https://learn.microsoft.com/ef/core/cli/dotnet) global tool for migrations:
  `dotnet tool install --global dotnet-ef`

### Backend setup

Configure the database connection and JWT signing key via .NET User Secrets (placeholders in
`appsettings.json` are not real credentials):

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=altitudelog;Username=postgres;Password=<your password>" \
  --project src/AltitudELog.API

dotnet user-secrets set "Jwt:Key" "<a real key, at least 32 characters>" \
  --project src/AltitudELog.API
```

Then, from the repo root:

```bash
dotnet restore
dotnet build AltitudELog.slnx

# Apply migrations (requires the Postgres connection above to be reachable)
dotnet ef database update --project src/AltitudELog.Infrastructure --startup-project src/AltitudELog.API

# Run the API (http://localhost:5264)
dotnet run --project src/AltitudELog.API --launch-profile http
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev      # http://localhost:5180
npm run build    # tsc -b && vite build
npm run lint      # oxlint
```

`frontend/.env.development` already points `VITE_API_BASE_URL` at `http://localhost:5264` to match the API's
default `http` launch profile.

## Running tests

```bash
dotnet test AltitudELog.slnx
```

This runs both the fast unit test project and the Testcontainers-backed integration test project. **Docker must
be running** for the integration tests — without it they fail with a `DockerUnavailableException` rather than a
real assertion failure. To run only the fast unit tests:

```bash
dotnet test tests/AltitudELog.Application.UnitTests
```

## License

MIT — see [LICENSE](./LICENSE).

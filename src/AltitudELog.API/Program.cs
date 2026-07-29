using System.Text;
using System.Text.Json.Serialization;
using AltitudELog.API.Common;
using AltitudELog.API.Services;
using AltitudELog.Application;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Infrastructure;
using AltitudELog.Infrastructure.Persistence;
using Hangfire;
using Hangfire.Dashboard;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Scalar.AspNetCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

// QuestPDF Community license — free for this use case (personal/portfolio project,
// well under the revenue threshold), same revenue-gated license shape already
// documented for MediatR in CLAUDE.md.
QuestPDF.Settings.License = LicenseType.Community;

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, loggerConfig) => loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // Add services to the container.

    builder.Services.AddControllers()
        .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
    // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
    builder.Services.AddOpenApi();

    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

    builder.Services.AddExceptionHandler<ValidationExceptionHandler>();
    builder.Services.AddExceptionHandler<DomainExceptionHandler>();
    builder.Services.AddProblemDetails();

    // Behind Railway's TLS-terminating proxy the app receives HTTP with the original
    // scheme in X-Forwarded-Proto; honour it so redirects/URLs stay https.
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

        // Honour exactly one hop — the entry the proxy directly in front of us appended. Anything
        // further left in X-Forwarded-For is client-supplied. This matters because the rate-limit
        // policies below partition on the resulting RemoteIpAddress: without the limit, a caller
        // could rotate a spoofed header per request and get a fresh 5-per-minute login bucket
        // every time.
        options.ForwardLimit = 1;

        // Clearing the known-proxy allowlist makes X-Forwarded-For trusted from *any* peer, which
        // combined with the IP-partitioned rate limiter means anyone who can reach the app
        // directly gets an unlimited supply of login buckets. Railway's proxy IP isn't stable
        // enough to allowlist, so it stays opt-in per deployment rather than on by default:
        // set ForwardedHeaders__TrustAnyProxy=true only where a proxy really does sit in front
        // (and where the app is not reachable around it).
        if (builder.Configuration.GetValue<bool>("ForwardedHeaders:TrustAnyProxy"))
        {
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        }
    });

    const string FrontendCorsPolicy = "FrontendCorsPolicy";
    var corsOriginsSection = builder.Configuration.GetSection("Cors:AllowedOrigins");
    var allowedOrigins = corsOriginsSection.Get<string[]>() ?? ["http://localhost:5180"];
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(FrontendCorsPolicy, policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
    });

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
            };
        });

    builder.Services.AddAuthorization();

    // Brute-force/credential-stuffing throttle for /Auth/login: 5 attempts per minute per
    // client IP by default. QueueLimit 0 means the 6th+ request in the window is rejected
    // immediately (429) rather than queued — login is interactive, there's nothing to gain
    // by delaying it. Configurable so integration tests (all sharing one loopback IP across
    // many legitimately-logging-in test cases) can raise the limit without touching the
    // production default. Read lazily inside the per-request policy lambda, not eagerly
    // here — WebApplicationFactory's test configuration overrides aren't guaranteed to be
    // merged into builder.Configuration yet at this point in the top-level script, only by
    // the time the host actually starts serving requests.
    builder.Services.AddRateLimiter(options =>
    {
        options.AddPolicy("login", httpContext =>
        {
            var permitLimit = builder.Configuration.GetValue<int?>("RateLimiting:Login:PermitLimit") ?? 5;
            var window = TimeSpan.FromSeconds(
                builder.Configuration.GetValue<int?>("RateLimiting:Login:WindowSeconds") ?? 60);

            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = window,
                    QueueLimit = 0
                });
        });

        // Shared throttle for the other Auth endpoints (register/forgot-password/reset-password/
        // refresh): looser than login's 5/min since these are one-shot flows rather than something
        // legitimately retried in a tight loop, but still capped so a single client can't email-bomb
        // a victim via forgot-password or mass-create accounts via register.
        options.AddPolicy("auth", httpContext =>
        {
            var permitLimit = builder.Configuration.GetValue<int?>("RateLimiting:Auth:PermitLimit") ?? 10;
            var window = TimeSpan.FromSeconds(
                builder.Configuration.GetValue<int?>("RateLimiting:Auth:WindowSeconds") ?? 60);

            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = window,
                    QueueLimit = 0
                });
        });

        options.OnRejected = async (context, cancellationToken) =>
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status429TooManyRequests,
                Title = "Too Many Requests",
                Detail = "Too many attempts. Please wait a moment and try again."
            };
            await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        };
    });

    var app = builder.Build();

    var jwtKey = app.Configuration["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    {
        throw new InvalidOperationException(
            "Jwt:Key must be configured and at least 32 bytes long (HS256 requires a 256-bit signing key).");
    }

    // Falling back to the localhost dev origin is correct for local/CI, but in Production it
    // would silently CORS-block the live frontend with no startup signal — fail fast instead.
    if (app.Environment.IsProduction() && !corsOriginsSection.Exists())
    {
        throw new InvalidOperationException(
            "Cors:AllowedOrigins must be configured in Production (see the Cors__AllowedOrigins__0 " +
            "Railway environment variable).");
    }

    // A warning rather than a throw: running in Production without it is degraded (every client
    // behind the proxy shares one rate-limit partition, because RemoteIpAddress is the proxy's)
    // but still correct and safe, whereas throwing would take a working deployment offline.
    if (app.Environment.IsProduction()
        && !app.Configuration.GetValue<bool>("ForwardedHeaders:TrustAnyProxy"))
    {
        Log.Warning(
            "ForwardedHeaders:TrustAnyProxy is not enabled in Production. X-Forwarded-For will be " +
            "ignored, so the per-IP rate limiters will partition every request behind the proxy " +
            "into a single bucket. Set ForwardedHeaders__TrustAnyProxy=true if a proxy fronts this app.");
    }

    // Apply pending EF Core migrations on startup so a fresh managed database
    // (e.g. Railway Postgres) gets the schema without a manual `dotnet ef` step.
    // Retry a few times: managed DBs / private networking can be briefly unready
    // at container start, and we must not crash-loop on that race.
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                db.Database.Migrate();
                break;
            }
            catch (Exception ex) when (attempt < 10)
            {
                startupLogger.LogWarning(ex,
                    "Database not ready for migration (attempt {Attempt}/10); retrying in 3s.", attempt);
                Thread.Sleep(TimeSpan.FromSeconds(3));
            }
        }
    }

    // Configure the HTTP request pipeline.
    // OpenAPI/Scalar are always mapped (not dev-gated) so reviewers can explore the
    // API on the live deployment, not just locally.
    app.MapOpenApi();
    app.MapScalarApiReference();

    app.UseForwardedHeaders();

    app.UseExceptionHandler();

    app.UseSerilogRequestLogging();

    // TLS is terminated by the platform proxy in production; only redirect locally.
    if (app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors(FrontendCorsPolicy);

    app.UseAuthentication();
    app.UseAuthorization();
    app.UseRateLimiter();

    app.MapControllers();

    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = HealthCheckResponseWriter.WriteJson
    });

    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = [new HangfireBasicAuthFilter(app.Configuration)]
    });

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");

    // Non-zero exit is what makes the fail-fast guards above (Jwt:Key length, production
    // Cors:AllowedOrigins, exhausted migration retries) actually fail. Logging Fatal and
    // falling out of the catch would exit 0, and Railway/Docker/CI would report the deploy
    // as successful while the app was never able to serve a request.
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }

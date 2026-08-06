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

QuestPDF.Settings.License = LicenseType.Community;

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, loggerConfig) => loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());


    builder.Services.AddControllers()
        .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
    builder.Services.AddOpenApi();

    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

    builder.Services.AddExceptionHandler<ValidationExceptionHandler>();
    builder.Services.AddExceptionHandler<DomainExceptionHandler>();
    builder.Services.AddProblemDetails();

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

        options.ForwardLimit = 1;

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

    if (app.Environment.IsProduction() && !corsOriginsSection.Exists())
    {
        throw new InvalidOperationException(
            "Cors:AllowedOrigins must be configured in Production (see the Cors__AllowedOrigins__0 " +
            "Railway environment variable).");
    }

    if (app.Environment.IsProduction()
        && !app.Configuration.GetValue<bool>("ForwardedHeaders:TrustAnyProxy"))
    {
        Log.Warning(
            "ForwardedHeaders:TrustAnyProxy is not enabled in Production. X-Forwarded-For will be " +
            "ignored, so the per-IP rate limiters will partition every request behind the proxy " +
            "into a single bucket. Set ForwardedHeaders__TrustAnyProxy=true if a proxy fronts this app.");
    }

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

    app.MapOpenApi();
    app.MapScalarApiReference();

    app.UseForwardedHeaders();

    app.UseExceptionHandler();

    app.UseSerilogRequestLogging();

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

    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }

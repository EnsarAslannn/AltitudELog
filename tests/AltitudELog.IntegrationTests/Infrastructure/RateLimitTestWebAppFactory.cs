using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Infrastructure;

// Keeps the real production login rate limit (5/minute) instead of the high limit
// IntegrationTestWebAppFactory uses for every other collection — this is the one place
// that actually needs to observe a 429.
public class RateLimitTestWebAppFactory : IntegrationTestWebAppFactory
{
    protected override int LoginRateLimitPermitLimit => 5;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<IStartupFilter, RemoteIpAddressStartupFilter>();
        });
    }

    // TestServer leaves Connection.RemoteIpAddress null, and ForwardedHeadersMiddleware skips its
    // known-proxy check when it has no peer address to check — so without this the X-Forwarded-For
    // header is applied unconditionally and RateLimitSpoofingTests can't tell a working
    // known-proxy allowlist from a missing one. Giving the connection a concrete non-loopback
    // address makes the middleware behave the way it does against a real socket.
    //
    // The address is per-request (X-Test-Client-Ip) so test classes sharing this factory don't
    // share a rate-limit partition — the limiter's window outlives an individual test.
    private sealed class RemoteIpAddressStartupFilter : IStartupFilter
    {
        private const string TestClientIpHeader = "X-Test-Client-Ip";

        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.Use(async (context, nextMiddleware) =>
            {
                var requested = context.Request.Headers[TestClientIpHeader].ToString();
                context.Connection.RemoteIpAddress = IPAddress.TryParse(requested, out var address)
                    ? address
                    : IPAddress.Parse("198.51.100.7");
                context.Connection.RemotePort = 51234;

                await nextMiddleware();
            });

            next(app);
        };
    }
}

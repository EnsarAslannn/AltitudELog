using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Infrastructure;

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

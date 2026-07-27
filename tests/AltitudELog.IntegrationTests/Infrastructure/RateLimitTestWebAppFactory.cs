namespace AltitudELog.IntegrationTests.Infrastructure;

// Keeps the real production login rate limit (5/minute) instead of the high limit
// IntegrationTestWebAppFactory uses for every other collection — this is the one place
// that actually needs to observe a 429.
public class RateLimitTestWebAppFactory : IntegrationTestWebAppFactory
{
    protected override int LoginRateLimitPermitLimit => 5;
}

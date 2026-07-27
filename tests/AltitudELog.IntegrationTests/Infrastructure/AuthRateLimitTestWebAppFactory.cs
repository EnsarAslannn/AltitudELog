namespace AltitudELog.IntegrationTests.Infrastructure;

// Keeps the real production "auth" rate limit (10/minute) instead of the high limit
// IntegrationTestWebAppFactory uses for every other collection — this is the one place
// that actually needs to observe a 429 on register/forgot-password/reset-password/refresh.
public class AuthRateLimitTestWebAppFactory : IntegrationTestWebAppFactory
{
    protected override int AuthRateLimitPermitLimit => 10;
}

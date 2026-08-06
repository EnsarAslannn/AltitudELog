namespace AltitudELog.IntegrationTests.Infrastructure;

public class AuthRateLimitTestWebAppFactory : IntegrationTestWebAppFactory
{
    protected override int AuthRateLimitPermitLimit => 10;
}

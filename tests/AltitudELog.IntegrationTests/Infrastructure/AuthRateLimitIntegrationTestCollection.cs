namespace AltitudELog.IntegrationTests.Infrastructure;

// A separate collection from "Integration", backed by AuthRateLimitTestWebAppFactory (the real
// 10-per-minute "auth" limit, not the high limit every other collection uses) — the rate
// limiter's in-memory bucket is shared for the lifetime of one factory instance, so this
// test must not share that instance with the rest of the suite.
[CollectionDefinition("AuthRateLimitIntegration")]
public class AuthRateLimitIntegrationTestCollection : ICollectionFixture<AuthRateLimitTestWebAppFactory>
{
}

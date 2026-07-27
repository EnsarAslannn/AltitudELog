namespace AltitudELog.IntegrationTests.Infrastructure;

// A separate collection from "Integration", backed by RateLimitTestWebAppFactory (the real
// 5-per-minute login limit, not the high limit every other collection uses) — the rate
// limiter's in-memory bucket is shared for the lifetime of one factory instance, so this
// test must not share that instance with the rest of the suite.
[CollectionDefinition("RateLimitIntegration")]
public class RateLimitIntegrationTestCollection : ICollectionFixture<RateLimitTestWebAppFactory>
{
}

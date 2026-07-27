using Xunit;

// Two collections now exist ("Integration" and "RateLimitIntegration"), each backing a
// WebApplicationFactory<Program> against this project's top-level-statement Program.cs.
// xUnit runs distinct collections in parallel by default, and WebApplicationFactory's host
// resolution (HostFactoryResolver, which intercepts Program.Main via a static diagnostic
// listener) is not safe against two concurrent Main() invocations in the same process —
// it manifests as one factory's boot silently failing ("entry point exited without ever
// building an IHost"). Serializing collections avoids that race.
[assembly: CollectionBehavior(DisableTestParallelization = true)]

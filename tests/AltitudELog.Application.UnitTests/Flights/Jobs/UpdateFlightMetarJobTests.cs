using AltitudELog.Application.Flights.Jobs;
using AwesomeAssertions;
using Hangfire;

namespace AltitudELog.Application.UnitTests.Flights.Jobs;

public class UpdateFlightMetarJobTests
{
    [Fact]
    public void Job_Is_Limited_To_Three_Automatic_Retries()
    {
        var attribute = typeof(UpdateFlightMetarJob)
            .GetCustomAttributes(typeof(AutomaticRetryAttribute), inherit: false)
            .Cast<AutomaticRetryAttribute>()
            .SingleOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Attempts.Should().Be(3);
    }
}

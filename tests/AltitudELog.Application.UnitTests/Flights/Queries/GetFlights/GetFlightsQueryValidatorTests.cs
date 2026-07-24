using AltitudELog.Application.Flights.Queries.GetFlights;
using AwesomeAssertions;

namespace AltitudELog.Application.UnitTests.Flights.Queries.GetFlights;

public class GetFlightsQueryValidatorTests
{
    private readonly GetFlightsQueryValidator _validator = new();

    [Theory]
    [InlineData(1, 1)]
    [InlineData(1, 100)]
    [InlineData(5, 20)]
    public void Validate_Should_Pass_For_Valid_Page_Bounds(int pageNumber, int pageSize)
    {
        var result = _validator.Validate(new GetFlightsQuery { PageNumber = pageNumber, PageSize = pageSize });

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_Should_Fail_When_PageNumber_Is_Zero()
    {
        var result = _validator.Validate(new GetFlightsQuery { PageNumber = 0, PageSize = 20 });

        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Validate_Should_Fail_When_PageSize_Is_Out_Of_Range(int pageSize)
    {
        var result = _validator.Validate(new GetFlightsQuery { PageNumber = 1, PageSize = pageSize });

        result.IsValid.Should().BeFalse();
    }
}

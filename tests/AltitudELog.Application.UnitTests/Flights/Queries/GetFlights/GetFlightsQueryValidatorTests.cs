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

    [Fact]
    public void Validate_Should_Pass_When_No_Filters_Are_Supplied()
    {
        var result = _validator.Validate(new GetFlightsQuery());

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_Should_Fail_When_Search_Exceeds_MaxLength()
    {
        var result = _validator.Validate(new GetFlightsQuery { Search = new string('a', 101) });

        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("LTF")]
    [InlineData("LTFMM")]
    public void Validate_Should_Fail_When_An_Icao_Filter_Is_Not_Four_Characters(string icao)
    {
        _validator.Validate(new GetFlightsQuery { OriginICAO = icao }).IsValid.Should().BeFalse();
        _validator.Validate(new GetFlightsQuery { DestinationICAO = icao }).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_Should_Ignore_An_Empty_Icao_Filter()
    {
        var result = _validator.Validate(new GetFlightsQuery { OriginICAO = "" });

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_Should_Fail_When_DateTo_Precedes_DateFrom()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = _validator.Validate(new GetFlightsQuery
        {
            DateFrom = today,
            DateTo = today.AddDays(-1)
        });

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_Should_Pass_When_Only_One_End_Of_The_Date_Range_Is_Given()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        _validator.Validate(new GetFlightsQuery { DateFrom = today }).IsValid.Should().BeTrue();
        _validator.Validate(new GetFlightsQuery { DateTo = today }).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_Should_Fail_For_A_SortBy_Outside_The_Enum()
    {
        var result = _validator.Validate(new GetFlightsQuery { SortBy = (FlightSortField)999 });

        result.IsValid.Should().BeFalse();
    }
}

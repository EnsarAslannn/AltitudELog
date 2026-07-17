using MediatR;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public record CreateFlightCommand(
    string OriginICAO,
    string DestinationICAO,
    TimeSpan FlightTime,
    string AircraftType,
    DateOnly Date,
    string? METARInfo
) : IRequest<Guid>;

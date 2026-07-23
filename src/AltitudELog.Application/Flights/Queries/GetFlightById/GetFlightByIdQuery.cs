using AltitudELog.Application.Flights.Queries.GetFlights;
using MediatR;

namespace AltitudELog.Application.Flights.Queries.GetFlightById;

public record GetFlightByIdQuery(Guid FlightId) : IRequest<FlightDto?>;

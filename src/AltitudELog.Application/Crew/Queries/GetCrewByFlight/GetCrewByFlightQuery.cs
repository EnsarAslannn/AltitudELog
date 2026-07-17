using MediatR;

namespace AltitudELog.Application.Crew.Queries.GetCrewByFlight;

public record GetCrewByFlightQuery(Guid FlightId) : IRequest<List<CrewDto>>;

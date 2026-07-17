using MediatR;

namespace AltitudELog.Application.Pilots.Queries.GetPilots;

public record GetPilotsQuery : IRequest<List<PilotDto>>;

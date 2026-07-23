using MediatR;

namespace AltitudELog.Application.Pilots.Queries.GetPilotLogbook;

public record GetPilotLogbookQuery(Guid PilotId) : IRequest<PilotLogbookDto?>;

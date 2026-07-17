using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public record CreateCrewCommand(
    Guid FlightId,
    Guid PilotId,
    DutyRole DutyRole
) : IRequest<Guid>;

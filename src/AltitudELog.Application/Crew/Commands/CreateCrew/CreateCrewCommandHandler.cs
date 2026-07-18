using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandHandler : IRequestHandler<CreateCrewCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateCrewCommandHandler> _logger;

    public CreateCrewCommandHandler(IApplicationDbContext context, ILogger<CreateCrewCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateCrewCommand request, CancellationToken cancellationToken)
    {
        var crew = new AltitudELog.Domain.Entities.Crew
        {
            Id = Guid.NewGuid(),
            FlightId = request.FlightId,
            PilotId = request.PilotId,
            DutyRole = request.DutyRole
        };

        _context.Crew.Add(crew);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Pilot {PilotId} assigned to flight {FlightId} as {DutyRole}", crew.PilotId, crew.FlightId, crew.DutyRole);

        return crew.Id;
    }
}

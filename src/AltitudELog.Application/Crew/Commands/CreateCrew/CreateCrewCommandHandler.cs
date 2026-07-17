using AltitudELog.Application.Common.Interfaces;
using MediatR;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandHandler : IRequestHandler<CreateCrewCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateCrewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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

        return crew.Id;
    }
}

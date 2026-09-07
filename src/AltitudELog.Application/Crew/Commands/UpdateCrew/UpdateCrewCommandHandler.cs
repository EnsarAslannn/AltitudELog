using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Crew.Commands.UpdateCrew;

public class UpdateCrewCommandHandler : IRequestHandler<UpdateCrewCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<UpdateCrewCommandHandler> _logger;

    public UpdateCrewCommandHandler(IApplicationDbContext context, ILogger<UpdateCrewCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(UpdateCrewCommand request, CancellationToken cancellationToken)
    {
        var assignment = await _context.Crew.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException($"Crew assignment '{request.Id}' does not exist.");

        var flightIsCancelled = await _context.Flights
            .AnyAsync(f => f.Id == assignment.FlightId && f.IsCancelled, cancellationToken);

        if (flightIsCancelled)
        {
            throw new InvalidOperationException(
                $"Flight '{assignment.FlightId}' is cancelled and its crew cannot be changed.");
        }

        var previousRole = assignment.DutyRole;
        assignment.DutyRole = request.DutyRole;

        await _context.SaveChangesAsync(cancellationToken);

        request.CacheKeysToInvalidate =
            [CacheKeys.CrewByFlight(assignment.FlightId), CacheKeys.PilotProfile(assignment.PilotId)];

        _logger.LogInformation(
            "Crew assignment {CrewId} on flight {FlightId} changed from {PreviousRole} to {DutyRole}",
            assignment.Id, assignment.FlightId, previousRole, assignment.DutyRole);
    }
}

using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<LogoutCommandHandler> _logger;

    public LogoutCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUserService, ILogger<LogoutCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var pilotId = _currentUserService.PilotId
            ?? throw new UnauthorizedAccessException("No authenticated pilot.");

        var pilot = await _context.Pilots.FirstOrDefaultAsync(p => p.Id == pilotId, cancellationToken);
        if (pilot is null)
        {
            return;
        }

        pilot.RefreshTokenHash = null;
        pilot.RefreshTokenExpiresAtUtc = null;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pilot {PilotId} logged out", pilotId);
    }
}

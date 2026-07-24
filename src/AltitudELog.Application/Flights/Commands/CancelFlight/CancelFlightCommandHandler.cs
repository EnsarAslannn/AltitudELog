using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Commands.CancelFlight;

public class CancelFlightCommandHandler : IRequestHandler<CancelFlightCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CancelFlightCommandHandler> _logger;

    public CancelFlightCommandHandler(IApplicationDbContext context, ILogger<CancelFlightCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(CancelFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = await _context.Flights.FirstOrDefaultAsync(f => f.Id == request.FlightId, cancellationToken)
            ?? throw new NotFoundException($"Flight '{request.FlightId}' does not exist.");

        flight.IsCancelled = true;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Flight {FlightId} cancelled", flight.Id);
    }
}

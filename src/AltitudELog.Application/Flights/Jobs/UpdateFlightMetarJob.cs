using AltitudELog.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Jobs;

public class UpdateFlightMetarJob
{
    private readonly IApplicationDbContext _context;
    private readonly IMetarService _metarService;
    private readonly ILogger<UpdateFlightMetarJob> _logger;

    public UpdateFlightMetarJob(
        IApplicationDbContext context,
        IMetarService metarService,
        ILogger<UpdateFlightMetarJob> logger)
    {
        _context = context;
        _metarService = metarService;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid flightId, string icaoCode, CancellationToken cancellationToken)
    {
        var flight = await _context.Flights.FirstOrDefaultAsync(f => f.Id == flightId, cancellationToken);
        if (flight is null)
        {
            _logger.LogWarning("METAR job skipped: flight {FlightId} not found", flightId);
            return;
        }

        var metar = await _metarService.GetRawMetarAsync(icaoCode, cancellationToken);
        if (metar is null)
        {
            _logger.LogWarning("No METAR observation available for {Icao} (flight {FlightId})", icaoCode, flightId);
            return;
        }

        flight.METARInfo = metar;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated METAR for flight {FlightId}: {Metar}", flightId, metar);
    }
}

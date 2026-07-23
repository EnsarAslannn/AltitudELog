using AltitudELog.Application.Flights.Jobs;
using Hangfire;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Events;

public class FlightUpdatedEventHandler : INotificationHandler<FlightUpdatedEvent>
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<FlightUpdatedEventHandler> _logger;

    public FlightUpdatedEventHandler(IBackgroundJobClient backgroundJobClient, ILogger<FlightUpdatedEventHandler> logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public Task Handle(FlightUpdatedEvent notification, CancellationToken cancellationToken)
    {
        var jobId = _backgroundJobClient.Enqueue<UpdateFlightMetarJob>(
            job => job.ExecuteAsync(notification.FlightId, notification.OriginICAO, CancellationToken.None));

        _logger.LogInformation(
            "Enqueued METAR re-fetch job {JobId} for flight {FlightId} ({Icao}) after origin change",
            jobId, notification.FlightId, notification.OriginICAO);

        return Task.CompletedTask;
    }
}

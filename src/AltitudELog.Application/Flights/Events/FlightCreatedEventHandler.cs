using AltitudELog.Application.Flights.Jobs;
using Hangfire;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Events;

public class FlightCreatedEventHandler : INotificationHandler<FlightCreatedEvent>
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<FlightCreatedEventHandler> _logger;

    public FlightCreatedEventHandler(IBackgroundJobClient backgroundJobClient, ILogger<FlightCreatedEventHandler> logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public Task Handle(FlightCreatedEvent notification, CancellationToken cancellationToken)
    {
        var jobId = _backgroundJobClient.Enqueue<UpdateFlightMetarJob>(
            job => job.ExecuteAsync(notification.FlightId, notification.OriginICAO, CancellationToken.None));

        _logger.LogInformation(
            "Enqueued METAR fetch job {JobId} for flight {FlightId} ({Icao})",
            jobId, notification.FlightId, notification.OriginICAO);

        return Task.CompletedTask;
    }
}

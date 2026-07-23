using MediatR;

namespace AltitudELog.Application.Flights.Events;

public record FlightUpdatedEvent(Guid FlightId, string OriginICAO) : INotification;

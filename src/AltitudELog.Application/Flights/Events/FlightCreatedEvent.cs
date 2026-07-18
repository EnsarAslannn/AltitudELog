using MediatR;

namespace AltitudELog.Application.Flights.Events;

public record FlightCreatedEvent(Guid FlightId, string OriginICAO) : INotification;

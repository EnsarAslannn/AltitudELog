using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Caching;
using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.Crew.Commands.UpdateCrew;

/// <summary>
/// Changes an existing assignment's flight-specific duty role. The pilot and the flight are not
/// movable here on purpose — swapping the pilot would collide with the unique
/// <c>(FlightId, PilotId)</c> index, and is expressed as a remove plus a fresh assignment instead.
/// </summary>
public record UpdateCrewCommand(Guid Id, DutyRole DutyRole) : IRequest, ICacheInvalidatorCommand
{
    /// <summary>
    /// Mutable because the keys aren't knowable from the command's own fields: the flight and pilot
    /// behind this assignment have to be read first. The handler appends them after
    /// <c>SaveChangesAsync</c>, which <c>CacheInvalidationBehavior</c> reads once <c>next()</c> returns.
    /// </summary>
    [JsonIgnore]
    public string[] CacheKeysToInvalidate { get; set; } = [];
}

using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Crew.Commands.RemoveCrew;

/// <summary>
/// Removes a pilot from a flight's crew. This is a hard delete: <c>Crew</c> is a join row carrying
/// only a duty role, so there is nothing to keep once the assignment is undone — unlike a
/// <c>Flight</c>, which is cancelled rather than deleted because the flight record itself is the
/// operational history.
/// </summary>
public record RemoveCrewCommand(Guid Id) : IRequest, ICacheInvalidatorCommand
{
    /// <summary>
    /// Mutable for the same reason as <c>UpdateCrewCommand</c>'s: the flight and pilot behind the
    /// assignment have to be read before the keys are knowable. The handler fills this in after
    /// <c>SaveChangesAsync</c>.
    /// </summary>
    [JsonIgnore]
    public string[] CacheKeysToInvalidate { get; set; } = [];
}

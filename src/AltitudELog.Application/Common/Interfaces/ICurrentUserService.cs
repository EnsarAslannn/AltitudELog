using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? PilotId { get; }

    /// <summary>
    /// The caller's rank, read from the JWT role claim. Null when unauthenticated, or when the
    /// claim carries a value no longer present in <see cref="PilotRank"/>.
    /// </summary>
    PilotRank? Rank { get; }
}

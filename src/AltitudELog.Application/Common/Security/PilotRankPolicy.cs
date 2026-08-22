using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Common.Security;

/// <summary>
/// Which ranks count as "command" for authorization purposes. The controllers spell the same set
/// out as an exact-match list in <c>[Authorize(Roles = "Captain,ChiefPilot")]</c>, and the frontend
/// mirrors it in <c>routes/ranks.ts</c>; keep all three in step. Note that <see cref="PilotRank"/>
/// is not a hierarchy to these checks — a gate naming only Captain locks out ChiefPilot.
/// </summary>
public static class PilotRankPolicy
{
    public static bool IsCommandRank(PilotRank? rank) =>
        rank is PilotRank.Captain or PilotRank.ChiefPilot;
}

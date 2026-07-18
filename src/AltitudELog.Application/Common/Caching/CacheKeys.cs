namespace AltitudELog.Application.Common.Caching;

public static class CacheKeys
{
    public const string AllFlights = "flights:all";
    public const string AllPilots = "pilots:all";

    public static string CrewByFlight(Guid flightId) => $"crew:flight:{flightId}";
    public static string CrmReportsByFlight(Guid flightId) => $"crmreports:flight:{flightId}";
}

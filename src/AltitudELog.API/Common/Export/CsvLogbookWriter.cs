using System.Globalization;
using System.Text;
using AltitudELog.Application.Pilots.Queries.GetPilotLogbook;

namespace AltitudELog.API.Common.Export;

public static class CsvLogbookWriter
{
    public static byte[] Write(PilotLogbookDto logbook)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Date,Origin,Destination,AircraftType,DutyRole,FlightTime");

        foreach (var flight in logbook.Flights)
        {
            sb.AppendLine(string.Join(',',
                flight.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Quote(flight.OriginICAO),
                Quote(flight.DestinationICAO),
                Quote(flight.AircraftType),
                flight.DutyRole,
                flight.FlightTime));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string Quote(string value) =>
        value.Contains(',') || value.Contains('"')
            ? $"\"{value.Replace("\"", "\"\"")}\""
            : value;
}

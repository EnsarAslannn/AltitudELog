using System.Globalization;
using System.Linq;
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

    private static readonly char[] FormulaTriggerChars = ['=', '+', '-', '@'];

    // Spreadsheet apps (Excel, Sheets) treat a cell starting with =/+/-/@ as a formula; a
    // leading apostrophe forces it to be read as literal text, closing the CSV-injection vector.
    private static string EscapeFormulaInjection(string value) =>
        value.Length > 0 && FormulaTriggerChars.Contains(value[0])
            ? $"'{value}"
            : value;

    private static string Quote(string value)
    {
        value = EscapeFormulaInjection(value);
        return value.Contains(',') || value.Contains('"')
            ? $"\"{value.Replace("\"", "\"\"")}\""
            : value;
    }
}

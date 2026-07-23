using AltitudELog.Application.Pilots.Queries.GetPilotLogbook;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AltitudELog.API.Common.Export;

public static class PdfLogbookWriter
{
    public static byte[] Write(PilotLogbookDto logbook)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(column =>
                {
                    column.Item().Text("Uçuş Logbook").FontSize(18).Bold();
                    column.Item().PaddingTop(4).Text($"{logbook.PilotName} · {logbook.LicenseNumber}");
                });

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        foreach (var title in new[] { "Tarih", "Kalkış", "Varış", "Uçak Tipi", "Görev", "Süre" })
                        {
                            header.Cell().Border(1).Padding(4).Text(title).Bold();
                        }
                    });

                    foreach (var flight in logbook.Flights)
                    {
                        table.Cell().Border(1).Padding(4).Text(flight.Date.ToString("yyyy-MM-dd"));
                        table.Cell().Border(1).Padding(4).Text(flight.OriginICAO);
                        table.Cell().Border(1).Padding(4).Text(flight.DestinationICAO);
                        table.Cell().Border(1).Padding(4).Text(flight.AircraftType);
                        table.Cell().Border(1).Padding(4).Text(flight.DutyRole.ToString());
                        table.Cell().Border(1).Padding(4).Text(flight.FlightTime.ToString());
                    }
                });

                page.Footer().AlignRight().Text($"Toplam Saat: {logbook.TotalHours}").Bold();
            });
        });

        return document.GeneratePdf();
    }
}

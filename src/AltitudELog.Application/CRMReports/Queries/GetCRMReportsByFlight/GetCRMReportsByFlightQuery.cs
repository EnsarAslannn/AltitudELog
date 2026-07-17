using MediatR;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;

public record GetCRMReportsByFlightQuery(Guid FlightId) : IRequest<List<CRMReportDto>>;

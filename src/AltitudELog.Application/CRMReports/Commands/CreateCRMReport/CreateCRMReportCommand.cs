using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public record CreateCRMReportCommand(
    Guid FlightId,
    string Title,
    string Description,
    bool IsAnonymous,
    SeverityLevel SeverityLevel
) : IRequest<Guid>;

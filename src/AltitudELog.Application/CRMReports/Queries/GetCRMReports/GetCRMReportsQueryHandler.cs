using System.Linq.Expressions;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReports;

public class GetCRMReportsQueryHandler : IRequestHandler<GetCRMReportsQuery, CRMReportsPageResult>
{
    private readonly IApplicationDbContext _context;

    public GetCRMReportsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CRMReportsPageResult> Handle(GetCRMReportsQuery request, CancellationToken cancellationToken)
    {
        var reports = ApplyFilters(_context.CRMReports.AsNoTracking(), request);

        var totalCount = await reports.CountAsync(cancellationToken);

        var openCount = await reports.CountAsync(r => r.Status == CRMReportStatus.Open, cancellationToken);

        var underReviewCount = await reports
            .CountAsync(r => r.Status == CRMReportStatus.UnderReview, cancellationToken);

        var criticalOpenCount = await reports.CountAsync(
            r => r.SeverityLevel == Domain.Enums.SeverityLevel.Critical && r.Status != CRMReportStatus.Closed,
            cancellationToken);

        var items = await ApplySort(reports, request)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new CRMReportListItemDto
            {
                Id = r.Id,
                FlightId = r.FlightId,
                OriginICAO = r.Flight.OriginICAO,
                DestinationICAO = r.Flight.DestinationICAO,
                FlightDate = r.Flight.Date,
                Title = r.Title,
                Description = r.Description,
                IsAnonymous = r.IsAnonymous,
                SeverityLevel = r.SeverityLevel,
                Status = r.Status,
                CreatedDate = r.CreatedDate,
                UpdatedAtUtc = r.UpdatedAtUtc,

                // Anonymity is enforced here, on the way out — the reporter stays recorded in the
                // row for accountability, as the domain notes explain.
                ReporterId = r.IsAnonymous ? null : r.ReporterId,
                ReporterName = r.IsAnonymous ? null : r.Reporter!.Name
            })
            .ToListAsync(cancellationToken);

        return new CRMReportsPageResult(
            items,
            totalCount,
            request.PageNumber,
            request.PageSize,
            openCount,
            underReviewCount,
            criticalOpenCount);
    }

    private static IQueryable<CRMReport> ApplyFilters(IQueryable<CRMReport> reports, GetCRMReportsQuery request)
    {
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // ToLower().Contains rather than EF.Functions.ILike: ILike lives in the Npgsql package
            // and Application takes no provider dependency. Same call as GetFlightsQuery makes.
            var term = request.Search.Trim().ToLowerInvariant();

            reports = reports.Where(r =>
                r.Title.ToLower().Contains(term) || r.Description.ToLower().Contains(term));
        }

        if (request.Status is { } status)
        {
            reports = reports.Where(r => r.Status == status);
        }

        if (request.SeverityLevel is { } severity)
        {
            reports = reports.Where(r => r.SeverityLevel == severity);
        }

        if (request.DateFrom is { } dateFrom)
        {
            var from = dateFrom.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            reports = reports.Where(r => r.CreatedDate >= from);
        }

        if (request.DateTo is { } dateTo)
        {
            // Inclusive upper bound on a date, against a timestamp column: everything strictly
            // before the following midnight, so a report filed at 23:59 on DateTo still counts.
            var toExclusive = dateTo.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            reports = reports.Where(r => r.CreatedDate < toExclusive);
        }

        if (request.FlightId is { } flightId)
        {
            reports = reports.Where(r => r.FlightId == flightId);
        }

        return reports;
    }

    /// <summary>
    /// Both enums are persisted as strings (<c>HasConversion&lt;string&gt;()</c>), so ordering by
    /// the column itself sorts alphabetically — Critical, High, Low, Medium — which puts a Low
    /// report above a Medium one and reads as a bug in a triage queue. These map each value to its
    /// real rank, which EF translates to a CASE expression.
    /// </summary>
    private static readonly Expression<Func<CRMReport, int>> SeverityRank = r =>
        r.SeverityLevel == Domain.Enums.SeverityLevel.Critical ? 3
        : r.SeverityLevel == Domain.Enums.SeverityLevel.High ? 2
        : r.SeverityLevel == Domain.Enums.SeverityLevel.Medium ? 1
        : 0;

    /// <summary>Open first, then under review, then closed — the order a queue is worked in.</summary>
    private static readonly Expression<Func<CRMReport, int>> StatusRank = r =>
        r.Status == CRMReportStatus.Open ? 0
        : r.Status == CRMReportStatus.UnderReview ? 1
        : 2;

    private static IOrderedQueryable<CRMReport> ApplySort(IQueryable<CRMReport> reports, GetCRMReportsQuery request)
    {
        var descending = request.SortDescending;

        // Id is always the tiebreaker, so two reports sharing a sort value can't swap between
        // pages and hide one of themselves.
        return request.SortBy switch
        {
            CRMReportSortField.SeverityLevel => descending
                ? reports.OrderByDescending(SeverityRank).ThenByDescending(r => r.Id)
                : reports.OrderBy(SeverityRank).ThenBy(r => r.Id),
            CRMReportSortField.Status => descending
                ? reports.OrderByDescending(StatusRank).ThenByDescending(r => r.Id)
                : reports.OrderBy(StatusRank).ThenBy(r => r.Id),
            _ => descending
                ? reports.OrderByDescending(r => r.CreatedDate).ThenByDescending(r => r.Id)
                : reports.OrderBy(r => r.CreatedDate).ThenBy(r => r.Id)
        };
    }
}

using System.Text.Json.Serialization;
using AltitudELog.Application.Common.Caching;
using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.CRMReports.Commands.UpdateCRMReportStatus;

/// <summary>
/// Moves a filed report along its review. Deliberately the only mutation a report accepts — the
/// title, description and severity are the reporter's account of what happened, and a safety
/// record whose narrative can be edited after the fact is worth less than one that cannot.
/// </summary>
public record UpdateCRMReportStatusCommand(Guid Id, CRMReportStatus Status) : IRequest, ICacheInvalidatorCommand
{
    /// <summary>
    /// Mutable because the report's flight has to be read before <c>crmreports:flight:{id}</c> is
    /// knowable; the handler appends it after <c>SaveChangesAsync</c>.
    /// </summary>
    [JsonIgnore]
    public string[] CacheKeysToInvalidate { get; set; } = [CacheKeys.Stats];
}

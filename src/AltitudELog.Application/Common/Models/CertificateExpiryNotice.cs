namespace AltitudELog.Application.Common.Models;

/// <summary>Which of a pilot's tracked certificates a notice is about.</summary>
public enum CertificateKind
{
    License,
    Medical
}

/// <summary>
/// One certificate about to lapse. The kind travels as an enum rather than as a rendered label
/// because the wording is the delivery layer's business — Application has no language of its own.
/// </summary>
public record CertificateExpiryNotice(CertificateKind Kind, DateOnly ExpiryDate, int DaysRemaining);

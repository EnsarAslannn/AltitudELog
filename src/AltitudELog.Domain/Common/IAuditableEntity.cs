namespace AltitudELog.Domain.Common;

/// <summary>
/// Records who last changed a row and when. Split out from <see cref="IAuditableEntity"/> because
/// <c>CRMReport</c> already carries its own creation facts (<c>ReporterId</c>, <c>CreatedDate</c>)
/// that anonymity is enforced against — duplicating them as audit columns would give the same
/// truth two homes, and leave a reader guessing which one is authoritative.
/// </summary>
public interface IModificationAudited
{
    DateTime? UpdatedAtUtc { get; set; }
    Guid? UpdatedByPilotId { get; set; }
}

/// <summary>
/// Full provenance: who created a row and who last changed it.
///
/// <para><c>CreatedAtUtc</c> is nullable on purpose. Rows written before the audit trail existed
/// have no creation timestamp anywhere to recover, and the alternatives — year 0001, or the
/// migration's own run time — would both be fabricated history on a safety-relevant record. Null
/// means "not known", which is the truth. It also covers rows written by a background job, where
/// there is no acting pilot at all.</para>
///
/// <para>The pilot ids are plain <c>Guid?</c>s rather than navigations: a pilot is never deleted in
/// this system, so there is no delete-behaviour question to answer, and an FK per audit column
/// would put four more constraints on the hot write path for no read that needs them joined.</para>
/// </summary>
public interface IAuditableEntity : IModificationAudited
{
    DateTime? CreatedAtUtc { get; set; }
    Guid? CreatedByPilotId { get; set; }
}

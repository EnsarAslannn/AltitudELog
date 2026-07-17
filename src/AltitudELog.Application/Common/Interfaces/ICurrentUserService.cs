namespace AltitudELog.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? PilotId { get; }
}

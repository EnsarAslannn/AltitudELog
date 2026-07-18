namespace AltitudELog.Application.Common.Interfaces;

public interface IMetarService
{
    Task<string?> GetRawMetarAsync(string icaoCode, CancellationToken cancellationToken);
}

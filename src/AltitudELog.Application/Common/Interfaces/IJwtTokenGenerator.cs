using AltitudELog.Domain.Entities;

namespace AltitudELog.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAtUtc) GenerateToken(Pilot pilot);
}

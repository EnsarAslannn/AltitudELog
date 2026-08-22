using System.Security.Claims;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Enums;

namespace AltitudELog.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? PilotId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public PilotRank? Rank
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
            return Enum.TryParse<PilotRank>(value, out var rank) && Enum.IsDefined(rank) ? rank : null;
        }
    }
}

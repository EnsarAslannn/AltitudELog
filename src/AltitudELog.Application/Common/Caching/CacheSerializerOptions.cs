using System.Text.Json;
using System.Text.Json.Serialization;

namespace AltitudELog.Application.Common.Caching;

internal static class CacheSerializerOptions
{
    public static readonly JsonSerializerOptions Instance = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };
}

using System.Globalization;
using System.Text;
using AltitudELog.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Chat;

public sealed class PersonalChatService : IPersonalChatService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public PersonalChatService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ChatResponse?> TryAnswerAsync(
        ChatRequest request,
        CancellationToken cancellationToken)
    {
        var pilotId = _currentUser.PilotId;
        if (pilotId is null)
        {
            return null;
        }

        var message = Normalize(request.Message);
        var contextualAnswer = await TryAnswerFromPageContextAsync(
            request.Context,
            message,
            request.Language,
            cancellationToken);
        if (contextualAnswer is not null)
        {
            return contextualAnswer;
        }

        if (IsCertificateQuestion(message))
        {
            return await AnswerCertificateQuestionAsync(pilotId.Value, request.Language, cancellationToken);
        }

        if (IsLatestFlightQuestion(message))
        {
            return await AnswerLatestFlightQuestionAsync(pilotId.Value, request.Language, cancellationToken);
        }

        if (!IsMonthlyHoursQuestion(message))
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var nextMonth = monthStart.AddMonths(1);
        var durations = await _context.Crew
            .AsNoTracking()
            .Where(crew =>
                crew.PilotId == pilotId &&
                !crew.Flight.IsCancelled &&
                crew.Flight.Date >= monthStart &&
                crew.Flight.Date < nextMonth)
            .Select(crew => crew.Flight.FlightTime)
            .ToListAsync(cancellationToken);
        var total = TimeSpan.FromTicks(durations.Sum(duration => duration.Ticks));
        var isEnglish = request.Language.Equals("en", StringComparison.OrdinalIgnoreCase);

        return new ChatResponse(
            isEnglish
                ? $"You flew {FormatDuration(total, true)} this month."
                : $"Bu ay {FormatDuration(total, false)} uçtunuz.",
            [new ChatSource(isEnglish ? "My pilot profile" : "Pilot profilim", $"/pilots/{pilotId}")],
            isEnglish
                ? ["When do my certificates expire?", "Show my latest flight"]
                : ["Sertifikalarım ne zaman bitiyor?", "Son uçuşumu göster"],
            false);
    }

    private async Task<ChatResponse?> TryAnswerFromPageContextAsync(
        ChatPageContext? context,
        string message,
        string language,
        CancellationToken cancellationToken)
    {
        if (context is null || !Guid.TryParse(context.EntityId, out var entityId))
        {
            return null;
        }

        if (context.Page == "pilot" && IsSummaryQuestion(message))
        {
            return await AnswerContextPilotSummaryAsync(entityId, language, cancellationToken);
        }

        if (context.Page != "flight" ||
            (!message.Contains("metar", StringComparison.Ordinal) && !IsSummaryQuestion(message)))
        {
            return null;
        }

        var flight = await _context.Flights
            .AsNoTracking()
            .Where(item => item.Id == entityId)
            .Select(item => new
            {
                item.Id,
                item.OriginICAO,
                item.DestinationICAO,
                item.Date,
                item.AircraftType,
                item.FlightTime,
                item.METARInfo,
                item.IsCancelled
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (flight is null)
        {
            return null;
        }

        var isEnglish = language.Equals("en", StringComparison.OrdinalIgnoreCase);
        if (IsSummaryQuestion(message))
        {
            var status = flight.IsCancelled
                ? isEnglish ? "cancelled" : "iptal edilmiş"
                : isEnglish ? "active" : "aktif";
            return new ChatResponse(
                isEnglish
                    ? $"This is an {status} {flight.OriginICAO}–{flight.DestinationICAO} flight on {flight.Date:dd MMM yyyy}, operated with {flight.AircraftType}, lasting {FormatDuration(flight.FlightTime, true)}."
                    : $"Bu, {flight.Date:dd.MM.yyyy} tarihli, {flight.AircraftType} ile yapılan, {FormatDuration(flight.FlightTime, false)} süren {status} bir {flight.OriginICAO}–{flight.DestinationICAO} uçuşu.",
                [new ChatSource(isEnglish ? "Current flight" : "Mevcut uçuş", $"/flights/{flight.Id}")],
                isEnglish ? ["Show this flight's METAR"] : ["Bu uçuşun METAR kaydını göster"],
                false);
        }

        var answer = flight.METARInfo is null
            ? isEnglish
                ? $"No METAR has been recorded for this {flight.OriginICAO}–{flight.DestinationICAO} flight yet."
                : $"Bu {flight.OriginICAO}–{flight.DestinationICAO} uçuşu için henüz METAR kaydedilmemiş."
            : isEnglish
                ? $"The METAR recorded for this {flight.OriginICAO}–{flight.DestinationICAO} flight is: {flight.METARInfo}"
                : $"Bu {flight.OriginICAO}–{flight.DestinationICAO} uçuşu için kaydedilen METAR: {flight.METARInfo}";

        return new ChatResponse(
            answer,
            [new ChatSource(isEnglish ? "Current flight" : "Mevcut uçuş", $"/flights/{flight.Id}")],
            isEnglish ? ["How is automatic METAR added?"] : ["Otomatik METAR nasıl eklenir?"],
            false);
    }

    private async Task<ChatResponse?> AnswerContextPilotSummaryAsync(
        Guid pilotId,
        string language,
        CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .AsNoTracking()
            .Where(item => item.Id == pilotId)
            .Select(item => new { item.Id, item.Name, item.Rank })
            .FirstOrDefaultAsync(cancellationToken);
        if (pilot is null)
        {
            return null;
        }

        var durations = await _context.Crew
            .AsNoTracking()
            .Where(crew => crew.PilotId == pilotId && !crew.Flight.IsCancelled)
            .Select(crew => crew.Flight.FlightTime)
            .ToListAsync(cancellationToken);
        var total = TimeSpan.FromTicks(durations.Sum(duration => duration.Ticks));
        var isEnglish = language.Equals("en", StringComparison.OrdinalIgnoreCase);

        return new ChatResponse(
            isEnglish
                ? $"{pilot.Name} is a {pilot.Rank} with {durations.Count} recorded flights and {FormatDuration(total, true)} total flight time."
                : $"{pilot.Name}, {pilot.Rank} rütbesinde; {durations.Count} uçuş ve toplam {FormatDuration(total, false)} uçuş süresi kayıtlı.",
            [new ChatSource(isEnglish ? "Current pilot profile" : "Mevcut pilot profili", $"/pilots/{pilot.Id}")],
            [],
            false);
    }

    private async Task<ChatResponse?> AnswerCertificateQuestionAsync(
        Guid pilotId,
        string language,
        CancellationToken cancellationToken)
    {
        var certificates = await _context.Pilots
            .AsNoTracking()
            .Where(pilot => pilot.Id == pilotId)
            .Select(pilot => new { pilot.LicenseExpiryDate, pilot.MedicalExpiryDate })
            .FirstOrDefaultAsync(cancellationToken);
        if (certificates is null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var isEnglish = language.Equals("en", StringComparison.OrdinalIgnoreCase);
        var answer = isEnglish
            ? $"Licence: {FormatExpiry(certificates.LicenseExpiryDate, today, true)}. Medical: {FormatExpiry(certificates.MedicalExpiryDate, today, true)}."
            : $"Lisans: {FormatExpiry(certificates.LicenseExpiryDate, today, false)}. Sağlık: {FormatExpiry(certificates.MedicalExpiryDate, today, false)}.";

        return new ChatResponse(
            answer,
            [new ChatSource(isEnglish ? "My pilot profile" : "Pilot profilim", $"/pilots/{pilotId}")],
            isEnglish
                ? ["How many hours did I fly this month?", "Show my latest flight"]
                : ["Bu ay kaç saat uçtum?", "Son uçuşumu göster"],
            false);
    }

    private async Task<ChatResponse> AnswerLatestFlightQuestionAsync(
        Guid pilotId,
        string language,
        CancellationToken cancellationToken)
    {
        var flight = await _context.Crew
            .AsNoTracking()
            .Where(crew => crew.PilotId == pilotId && !crew.Flight.IsCancelled)
            .OrderByDescending(crew => crew.Flight.Date)
            .ThenByDescending(crew => crew.Flight.Id)
            .Select(crew => new
            {
                crew.Flight.Id,
                crew.Flight.OriginICAO,
                crew.Flight.DestinationICAO,
                crew.Flight.Date
            })
            .FirstOrDefaultAsync(cancellationToken);
        var isEnglish = language.Equals("en", StringComparison.OrdinalIgnoreCase);
        if (flight is null)
        {
            return new ChatResponse(
                isEnglish ? "You do not have a recorded flight yet." : "Henüz kayıtlı bir uçuşunuz yok.",
                [new ChatSource(isEnglish ? "Flights" : "Uçuşlar", "/dashboard")],
                [],
                false);
        }

        return new ChatResponse(
            isEnglish
                ? $"Your latest flight was {flight.OriginICAO}–{flight.DestinationICAO} on {flight.Date:dd MMM yyyy}."
                : $"Son uçuşunuz {flight.Date:dd.MM.yyyy} tarihli {flight.OriginICAO}–{flight.DestinationICAO} uçuşu.",
            [new ChatSource(isEnglish ? "Open flight" : "Uçuşu aç", $"/flights/{flight.Id}")],
            isEnglish
                ? ["How many hours did I fly this month?", "When do my certificates expire?"]
                : ["Bu ay kaç saat uçtum?", "Sertifikalarım ne zaman bitiyor?"],
            false);
    }

    private static bool IsMonthlyHoursQuestion(string message) =>
        (message.Contains("bu ay", StringComparison.Ordinal) ||
         message.Contains("this month", StringComparison.Ordinal)) &&
        (message.Contains("saat", StringComparison.Ordinal) ||
         message.Contains("hour", StringComparison.Ordinal) ||
         message.Contains("uctum", StringComparison.Ordinal) ||
         message.Contains("flew", StringComparison.Ordinal));

    private static bool IsCertificateQuestion(string message) =>
        (message.Contains("sertifika", StringComparison.Ordinal) ||
         message.Contains("lisans", StringComparison.Ordinal) ||
         message.Contains("medical", StringComparison.Ordinal) ||
         message.Contains("certificate", StringComparison.Ordinal)) &&
        (message.Contains("bit", StringComparison.Ordinal) ||
         message.Contains("gecer", StringComparison.Ordinal) ||
         message.Contains("expire", StringComparison.Ordinal));

    private static bool IsLatestFlightQuestion(string message) =>
        (message.Contains("son ucus", StringComparison.Ordinal) ||
         message.Contains("latest flight", StringComparison.Ordinal) ||
         message.Contains("last flight", StringComparison.Ordinal));

    private static bool IsSummaryQuestion(string message) =>
        message.Contains("ozet", StringComparison.Ordinal) ||
        message.Contains("summar", StringComparison.Ordinal);

    private static string FormatExpiry(DateOnly? date, DateOnly today, bool english)
    {
        if (date is null)
        {
            return english ? "not recorded" : "kayıtlı değil";
        }

        var days = date.Value.DayNumber - today.DayNumber;
        if (days < 0)
        {
            return english ? $"expired {-days} days ago" : $"{-days} gün önce sona erdi";
        }

        return english ? $"expires in {days} days" : $"{days} gün kaldı";
    }

    private static string FormatDuration(TimeSpan duration, bool english)
    {
        var hours = (int)duration.TotalHours;
        var minutes = duration.Minutes;
        if (english)
        {
            return minutes == 0 ? $"{hours} hours" : $"{hours} hours {minutes} minutes";
        }

        return minutes == 0 ? $"{hours} saat" : $"{hours} saat {minutes} dakika";
    }

    private static string Normalize(string value)
    {
        var decomposed = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character == 'ı' ? 'i' : character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}

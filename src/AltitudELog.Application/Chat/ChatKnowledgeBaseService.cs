using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AltitudELog.Application.Chat;

public sealed partial class ChatKnowledgeBaseService : IChatKnowledgeBaseService
{
    private const int MatchThreshold = 2;
    private const int MaximumHistoryMessages = 6;

    private static readonly KnowledgeTopic[] Topics =
    [
        new(
            "help",
            ["hangi soruları sorabilirim", "neler sorabilirim", "what can i ask", "what questions can i ask"],
            "Bana şunları sorabilirsiniz: uçuş kayıtları, mürettebat atamaları, CRM güvenlik raporları, otomatik METAR, pilot logbook, sertifikalar, hesaplar ve rütbe yetkileri.",
            "You can ask about flight records, crew assignments, CRM safety reports, automatic METAR, pilot logbooks, certificates, accounts and rank permissions.",
            new ChatSource("AltitudELog genel bakış", "/"),
            new ChatSource("AltitudELog overview", "/"),
            ["Otomatik METAR nasıl çalışır?", "CRM raporu anonim olabilir mi?", "Logbook'umu nasıl indiririm?"],
            ["How does automatic METAR work?", "Can a CRM report be anonymous?", "How do I export my logbook?"]),
        new(
            "overview",
            ["altitudelog", "özellik", "ozellik", "neler yapabilir", "what can", "features", "overview"],
            "AltitudELog; uçuş ve mürettebat yönetimi, CRM güvenlik raporları, otomatik METAR, pilot logbook ve sertifika takibini tek yerde toplar.",
            "AltitudELog brings flight and crew management, CRM safety reports, automatic METAR, pilot logbooks and certificate tracking together.",
            new ChatSource("AltitudELog genel bakış", "/"),
            new ChatSource("AltitudELog overview", "/"),
            ["Nasıl hesap oluştururum?", "Otomatik METAR nasıl çalışır?", "CRM raporu anonim olabilir mi?"],
            ["How do I create an account?", "How does automatic METAR work?", "Can a CRM report be anonymous?"]),
        new(
            "metar",
            ["metar", "hava durumu", "meteoroloji", "weather", "automatic weather"],
            "Otomatik METAR, bir uçuş kaydedildikten sonra kalkış havalimanı için arka planda alınır ve uçuş detayına eklenir. Kullanıcının METAR verisini elle girmesi gerekmez.",
            "Automatic METAR is fetched in the background for the departure airport after a flight is saved, then added to the flight detail. Pilots do not enter it manually.",
            new ChatSource("Operasyon yetenekleri", "/#yetenekler"),
            new ChatSource("Operations capabilities", "/#yetenekler"),
            ["METAR bilgisini nerede görebilirim?", "Yeni uçuşu kim oluşturabilir?", "Logbook'umu nasıl indiririm?"],
            ["Where can I see METAR?", "Who can create a flight?", "How do I export my logbook?"]),
        new(
            "logbook",
            ["logbook", "uçuş defteri", "ucus defteri", "profil", "profile", "csv", "pdf", "dışa aktar", "indir", "export", "download"],
            "Pilot profilindeki logbook, atandığınız uçuşlardan toplam saatleri ve son uçuşları oluşturur. Kendi kaydınızı CSV ve PDF olarak indirebilirsiniz.",
            "Your pilot profile builds the logbook from assigned flights, including total hours and recent flights. You can export your own logbook as CSV and PDF.",
            new ChatSource("Pilot logbook", "/#logbook"),
            new ChatSource("Pilot logbook", "/#logbook"),
            ["Profilimde neler var?", "Sertifika tarihleri nasıl izlenir?", "CRM raporu anonim olabilir mi?"],
            ["What is on my profile?", "How are certificate dates tracked?", "Can a CRM report be anonymous?"]),
        new(
            "flights",
            ["uçuş", "ucus", "rota", "icao", "aircraft", "flight", "route", "iptal", "cancel"],
            "Uçuş ekranında rota, tarih, uçak tipi ve durum bilgilerini görebilir; arama, filtreleme ve sıralama yapabilirsiniz. Yeni uçuş oluşturma, düzenleme ve iptal etme komuta rütbelerine açıktır.",
            "The flights screen supports route, date, aircraft type and status details with search, filters and sorting. Creating, editing and cancelling flights is limited to command ranks.",
            new ChatSource("Uçuş kayıtları", "/dashboard"),
            new ChatSource("Flight records", "/dashboard"),
            ["Yeni uçuşu kim oluşturabilir?", "METAR nasıl eklenir?", "Mürettebat nasıl atanır?"],
            ["Who can create a flight?", "How is METAR added?", "How do I assign crew?"]),
        new(
            "crew",
            ["mürettebat", "murettebat", "ekip", "görev rolü", "crew", "duty role", "assign pilot"],
            "Bir uçuşa birden fazla pilot, uçuşa özel görev rolüyle atanabilir. Aynı pilot aynı uçuşa iki kez eklenemez. Mürettebat ekleme, görev değiştirme ve çıkarma komuta rütbesi gerektirir.",
            "Multiple pilots can be assigned to a flight with flight-specific duty roles. The same pilot cannot be added twice. Adding, changing or removing crew requires a command rank.",
            new ChatSource("Mürettebat ataması", "/#yetenekler"),
            new ChatSource("Crew assignment", "/#yetenekler"),
            ["Komuta rütbeleri hangileri?", "CRM raporu nasıl oluşturulur?", "Uçuş detayına nasıl giderim?"],
            ["Which ranks are command ranks?", "How do I file a CRM report?", "How do I open a flight detail?"]),
        new(
            "crm",
            ["crm", "emniyet", "güvenlik raporu", "guvenlik raporu", "anonim", "safety report", "anonymous", "severity"],
            "CRM güvenlik raporları belirli bir uçuşa bağlı, önem dereceli ve isteğe bağlı olarak anonim kaydedilir. Komuta rütbeleri tüm raporları Emniyet ekranında inceleyip durumlarını güncelleyebilir.",
            "CRM safety reports are tied to a flight, include a severity level and may be anonymous. Command ranks can review all reports and update their status on the Safety screen.",
            new ChatSource("CRM raporları", "/#crm"),
            new ChatSource("CRM reports", "/#crm"),
            ["Rapor anonim olabilir mi?", "Emniyet ekranını kim görebilir?", "CRM istatistikleri nerede?"],
            ["Can a report be anonymous?", "Who can view the Safety screen?", "Where are CRM statistics?"]),
        new(
            "account",
            ["kayıt", "hesap", "giriş", "şifre", "sifre", "rütbe", "rutbe", "register", "account", "login", "password", "rank", "captain", "chief pilot"],
            "AltitudELog hesabı ad, lisans numarası, kullanıcı adı, e-posta, şifre ve rütbe ile oluşturulur. Captain ve ChiefPilot komuta rütbeleridir. Şifre sıfırlama bağlantısı giriş ekranından istenebilir.",
            "An AltitudELog account uses name, licence number, username, email, password and rank. Captain and ChiefPilot are command ranks. A password reset link can be requested from the login screen.",
            new ChatSource("Hesap oluştur", "/register"),
            new ChatSource("Create an account", "/register"),
            ["Komuta rütbeleri ne yapabilir?", "Şifremi nasıl sıfırlarım?", "Profilimde neler var?"],
            ["What can command ranks do?", "How do I reset my password?", "What is on my profile?"]),
        new(
            "certificates",
            ["sertifika", "lisans bitiş", "medical", "sağlık", "saglik", "certificate", "licence expiry", "license expiry"],
            "Lisans ve sağlık sertifikası son geçerlilik tarihleri pilot profilinde tutulur. Yaklaşan veya geçmiş tarihler profil ve yönetim istatistiklerinde görünür.",
            "Licence and medical certificate expiry dates are stored on the pilot profile. Upcoming or expired dates appear on the profile and in command statistics.",
            new ChatSource("Pilot profili", "/#logbook"),
            new ChatSource("Pilot profile", "/#logbook"),
            ["Logbook nasıl indirilir?", "Profilimi kim görebilir?", "İstatistikleri kim görebilir?"],
            ["How do I export my logbook?", "Who can view my profile?", "Who can view statistics?"])
    ];

    public ChatResponse Answer(ChatRequest request)
    {
        var language = request.Language.Equals("en", StringComparison.OrdinalIgnoreCase) ? "en" : "tr";
        var current = Normalize(request.Message);
        if (IsLiveWeatherRequest(current))
        {
            return OutOfScope(language);
        }

        var context = string.Join(' ', request.History
            .TakeLast(MaximumHistoryMessages)
            .Where(message => message.Role.Equals("user", StringComparison.OrdinalIgnoreCase))
            .Select(message => Normalize(message.Content)));

        var match = Topics
            .Select(topic => new { Topic = topic, Score = Score(topic, current, context) })
            .OrderByDescending(candidate => candidate.Score)
            .ThenBy(candidate => candidate.Topic.Id, StringComparer.Ordinal)
            .FirstOrDefault();

        if (match is null || match.Score < MatchThreshold)
        {
            return OutOfScope(language);
        }

        var topic = match.Topic;
        var isLocationFollowUp = topic.Id == "metar" && IsLocationQuestion(current);
        if (isLocationFollowUp)
        {
            return language == "en"
                ? new ChatResponse(
                    "Open a flight from the Flights page. The fetched METAR appears on that flight detail after the background job completes.",
                    [new ChatSource("Flight records", "/dashboard")],
                    topic.SuggestionsEn,
                    false)
                : new ChatResponse(
                    "Uçuşlar sayfasından bir uçuşu açın. Alınan METAR, arka plan görevi tamamlandıktan sonra uçuş detayında görünür.",
                    [new ChatSource("Uçuş kayıtları", "/dashboard")],
                    topic.SuggestionsTr,
                    false);
        }

        return language == "en"
            ? new ChatResponse(topic.AnswerEn, [topic.SourceEn], topic.SuggestionsEn, false)
            : new ChatResponse(topic.AnswerTr, [topic.SourceTr], topic.SuggestionsTr, false);
    }

    private static int Score(KnowledgeTopic topic, string current, string context)
    {
        var score = 0;
        foreach (var rawKeyword in topic.Keywords)
        {
            var keyword = Normalize(rawKeyword);
            if (ContainsTerm(current, keyword))
            {
                score += keyword.Contains(' ') ? 5 : 3;
            }
            else if (ContainsTerm(context, keyword))
            {
                score += 2;
            }
        }

        return score;
    }

    private static bool IsLocationQuestion(string message) =>
        ContainsTerm(message, "where") ||
        ContainsTerm(message, "see") ||
        ContainsTerm(message, "nerede") ||
        ContainsTerm(message, "gorurum") ||
        ContainsTerm(message, "gorebilirim");

    private static bool IsLiveWeatherRequest(string message) =>
        message.Contains("yarin", StringComparison.Ordinal) ||
        message.Contains("bugun", StringComparison.Ordinal) ||
        ContainsTerm(message, "tomorrow") ||
        ContainsTerm(message, "today") ||
        ContainsTerm(message, "forecast") ||
        ContainsTerm(message, "tahmin");

    private static bool ContainsTerm(string text, string term) =>
        term.Contains(' ')
            ? text.Contains(term, StringComparison.Ordinal)
            : TokenRegex().Matches(text).Any(match =>
                match.Value == term ||
                (term.Length >= 5 && match.Value.StartsWith(term, StringComparison.Ordinal)));

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

        return WhitespaceRegex().Replace(builder.ToString().Normalize(NormalizationForm.FormC), " ").Trim();
    }

    private static ChatResponse OutOfScope(string language) => language == "en"
        ? new ChatResponse(
            "That question is outside my scope. I only answer questions about AltitudELog and I will not invent information.",
            [new ChatSource("AltitudELog overview", "/")],
            ["What can AltitudELog do?", "How do I create an account?", "How does automatic METAR work?"],
            false,
            false)
        : new ChatResponse(
            "Bu soru kapsamım dışında. Yalnızca AltitudELog hakkında yanıt veriyorum ve bilgi uydurmuyorum.",
            [new ChatSource("AltitudELog genel bakış", "/")],
            ["AltitudELog neler yapabilir?", "Nasıl hesap oluştururum?", "Otomatik METAR nasıl çalışır?"],
            false,
            false);

    [GeneratedRegex("[a-z0-9]+", RegexOptions.CultureInvariant)]
    private static partial Regex TokenRegex();

    [GeneratedRegex("\\s+", RegexOptions.CultureInvariant)]
    private static partial Regex WhitespaceRegex();

    private sealed record KnowledgeTopic(
        string Id,
        IReadOnlyList<string> Keywords,
        string AnswerTr,
        string AnswerEn,
        ChatSource SourceTr,
        ChatSource SourceEn,
        IReadOnlyList<string> SuggestionsTr,
        IReadOnlyList<string> SuggestionsEn);
}

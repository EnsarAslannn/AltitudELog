using AltitudELog.Application.Chat;
using AwesomeAssertions;

namespace AltitudELog.Application.UnitTests.Chat;

public class ChatKnowledgeBaseServiceTests
{
    private readonly ChatKnowledgeBaseService _service = new();

    [Theory]
    [InlineData("tr", "METAR bilgisi nasıl ekleniyor?", "Otomatik METAR", "/#yetenekler")]
    [InlineData("en", "Can I export my logbook as PDF?", "CSV and PDF", "/#logbook")]
    public void Answer_Should_Return_The_Most_Relevant_Localized_Topic(
        string language,
        string message,
        string expectedAnswerFragment,
        string expectedSource)
    {
        var response = _service.Answer(new ChatRequest(message, language, []));

        response.Answer.Should().Contain(expectedAnswerFragment);
        response.Sources.Should().ContainSingle(source => source.Url == expectedSource);
        response.Suggestions.Should().HaveCountLessThanOrEqualTo(3);
        response.UsedAi.Should().BeFalse();
        response.IsAnswered.Should().BeTrue();
    }

    [Fact]
    public void Answer_Should_Use_Recent_History_For_A_Contextual_Follow_Up()
    {
        var history = new[]
        {
            new ChatHistoryMessage("user", "How does automatic METAR work?"),
            new ChatHistoryMessage("assistant", "It is fetched after a flight is created.")
        };

        var response = _service.Answer(new ChatRequest("Where can I see it?", "en", history));

        response.Answer.Should().Contain("flight detail");
        response.Sources.Should().ContainSingle(source => source.Url == "/dashboard");
    }

    [Theory]
    [InlineData("tr", "Bana yarınki hava durumunu söyler misin?", "kapsamım dışında")]
    [InlineData("en", "What is the capital of Canada?", "outside my scope")]
    public void Answer_Should_Not_Invent_Information_For_Unknown_Topics(
        string language,
        string message,
        string expectedAnswerFragment)
    {
        var response = _service.Answer(new ChatRequest(message, language, []));

        response.Answer.Should().Contain(expectedAnswerFragment);
        response.Sources.Should().ContainSingle(source => source.Url == "/");
        response.UsedAi.Should().BeFalse();
        response.IsAnswered.Should().BeFalse();
    }

    [Theory]
    [InlineData("tr", "AltitudELog neler yapabilir?", "uçuş ve mürettebat")]
    [InlineData("en", "What can AltitudELog do?", "flight and crew")]
    [InlineData("tr", "Şifremi nasıl sıfırlarım?", "Şifre sıfırlama")]
    [InlineData("en", "How can I filter flights?", "flights screen")]
    public void Answer_Should_Resolve_Predefined_And_Inflected_Questions(
        string language,
        string message,
        string expectedAnswerFragment)
    {
        var response = _service.Answer(new ChatRequest(message, language, []));

        response.Answer.Should().Contain(expectedAnswerFragment);
        response.UsedAi.Should().BeFalse();
    }

    [Theory]
    [InlineData("tr", "Hangi soruları sorabilirim?", "şunları sorabilirsiniz")]
    [InlineData("en", "What can I ask?", "You can ask about")]
    public void Answer_Should_Explain_Its_Supported_Question_Areas(
        string language,
        string message,
        string expectedAnswerFragment)
    {
        var response = _service.Answer(new ChatRequest(message, language, []));

        response.Answer.Should().Contain(expectedAnswerFragment);
        response.Suggestions.Should().NotContain(suggestion =>
            suggestion.Contains("filtre", StringComparison.OrdinalIgnoreCase) ||
            suggestion.Contains("filter flights", StringComparison.OrdinalIgnoreCase));
        response.Sources.Should().ContainSingle(source => source.Url == "/");
    }
}

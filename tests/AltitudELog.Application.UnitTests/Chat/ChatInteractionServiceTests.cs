using AltitudELog.Application.Chat;
using AltitudELog.Application.UnitTests.TestUtilities;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.Chat;

public class ChatInteractionServiceTests
{
    [Fact]
    public async Task RecordAsync_Should_Anonymize_And_Store_Only_Unanswered_Question_Text()
    {
        await using var context = CreateContext();
        var service = new ChatInteractionService(context);
        var request = new ChatRequest(
            "pilot@example.com için 8f5ca72b-2b9f-4c74-85b6-cb3d8ee6e671 ve 12345678 numarasını araştır",
            "tr",
            [],
            new ChatPageContext("flight", "8f5ca72b-2b9f-4c74-85b6-cb3d8ee6e671"));
        var response = new ChatResponse("Kapsam dışı", [], [], false, IsAnswered: false);

        var tracked = await service.RecordAsync(request, response, CancellationToken.None);

        tracked.InteractionId.Should().NotBeNull();
        var stored = await context.ChatInteractions.SingleAsync();
        stored.Id.Should().Be(tracked.InteractionId!.Value);
        stored.UnansweredQuestion.Should().Be("[email] için [id] ve [number] numarasını araştır");
        stored.Language.Should().Be("tr");
        stored.Page.Should().Be("flight");
        stored.IsAnswered.Should().BeFalse();
        stored.IsHelpful.Should().BeNull();
    }

    [Fact]
    public async Task SetFeedbackAsync_Should_Update_The_Tracked_Interaction()
    {
        await using var context = CreateContext();
        var service = new ChatInteractionService(context);
        var tracked = await service.RecordAsync(
            new ChatRequest("METAR nasıl çalışır?", "tr", []),
            new ChatResponse("Otomatik alınır.", [], [], false),
            CancellationToken.None);

        var updated = await service.SetFeedbackAsync(
            tracked.InteractionId!.Value,
            helpful: true,
            CancellationToken.None);

        updated.Should().BeTrue();
        var stored = await context.ChatInteractions.SingleAsync();
        stored.IsHelpful.Should().BeTrue();
        stored.UnansweredQuestion.Should().BeNull();
    }

    [Fact]
    public async Task GetUnansweredAsync_Should_Return_Only_Anonymized_Unanswered_Questions()
    {
        await using var context = CreateContext();
        var service = new ChatInteractionService(context);
        await service.RecordAsync(
            new ChatRequest("Yarın LTFM hava tahmini nedir?", "tr", []),
            new ChatResponse("Kapsam dışı", [], [], false, IsAnswered: false),
            CancellationToken.None);
        await service.RecordAsync(
            new ChatRequest("METAR nasıl çalışır?", "tr", []),
            new ChatResponse("Otomatik alınır", [], [], false),
            CancellationToken.None);

        var result = await service.GetUnansweredAsync(20, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Question.Should().Be("Yarın LTFM hava tahmini nedir?");
        result[0].Language.Should().Be("tr");
    }

    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestApplicationDbContext(options);
    }
}

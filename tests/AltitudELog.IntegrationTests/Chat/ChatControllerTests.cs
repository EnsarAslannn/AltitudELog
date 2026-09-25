using AltitudELog.API.Controllers;
using AltitudELog.Application.Chat;
using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace AltitudELog.IntegrationTests.Chat;

public class ChatControllerTests
{
    [Fact]
    public async Task PersonalPost_Returns_Personal_Answer_When_Intent_Is_Recognized()
    {
        var request = new ChatRequest("Bu ay kaç saat uçtum?", "tr", []);
        var expected = new ChatResponse(
            "Bu ay 2 saat uçtunuz.",
            [new ChatSource("Pilot profilim", "/pilots/pilot-1")],
            [],
            false);
        var personal = Substitute.For<IPersonalChatService>();
        personal.TryAnswerAsync(request, Arg.Any<CancellationToken>()).Returns(expected);
        var interactionId = Guid.NewGuid();
        var interactions = Substitute.For<IChatInteractionService>();
        interactions.RecordAsync(request, expected, Arg.Any<CancellationToken>())
            .Returns(expected with { InteractionId = interactionId });
        var controller = new PersonalChatController(new ChatKnowledgeBaseService(), personal, interactions);

        var action = await controller.Post(request, CancellationToken.None);

        var ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<ChatResponse>().Which.InteractionId.Should().Be(interactionId);
    }

    [Fact]
    public async Task FeedbackPost_Returns_NotFound_For_An_Unknown_Interaction()
    {
        var interactions = Substitute.For<IChatInteractionService>();
        interactions.SetFeedbackAsync(Arg.Any<Guid>(), Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(false);
        var controller = new ChatFeedbackController(interactions);

        var result = await controller.Post(
            Guid.NewGuid(),
            new ChatFeedbackRequest(true),
            CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task InsightsGet_Returns_Anonymized_Unanswered_Questions()
    {
        var expected = new[]
        {
            new UnansweredChatQuestionDto(
                Guid.NewGuid(),
                "Yarın hava nasıl?",
                "tr",
                "dashboard",
                DateTime.UtcNow,
                false)
        };
        var interactions = Substitute.For<IChatInteractionService>();
        interactions.GetUnansweredAsync(25, Arg.Any<CancellationToken>()).Returns(expected);
        var controller = new ChatInsightsController(interactions);

        var result = await controller.Get(25, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}

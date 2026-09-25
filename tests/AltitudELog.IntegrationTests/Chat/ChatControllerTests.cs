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
        var controller = new PersonalChatController(new ChatKnowledgeBaseService(), personal);

        var action = await controller.Post(request, CancellationToken.None);

        var ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}

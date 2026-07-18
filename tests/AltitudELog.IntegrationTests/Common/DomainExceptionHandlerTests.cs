using System.Text.Json;
using AltitudELog.API.Common;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.IntegrationTests.Common;

public class DomainExceptionHandlerTests
{
    private readonly DomainExceptionHandler _handler = new();

    [Theory]
    [InlineData(typeof(UnauthorizedAccessException), StatusCodes.Status401Unauthorized)]
    [InlineData(typeof(InvalidOperationException), StatusCodes.Status409Conflict)]
    public async Task TryHandleAsync_Should_Map_Known_Exceptions_To_Status_Code(Type exceptionType, int expectedStatusCode)
    {
        var exception = (Exception)Activator.CreateInstance(exceptionType, "boom")!;
        var httpContext = new DefaultHttpContext
        {
            Response = { Body = new MemoryStream() }
        };

        var handled = await _handler.TryHandleAsync(httpContext, exception, CancellationToken.None);

        handled.Should().BeTrue();
        httpContext.Response.StatusCode.Should().Be(expectedStatusCode);

        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(httpContext.Response.Body);
        problem!.Detail.Should().Be("boom");
    }

    [Fact]
    public async Task TryHandleAsync_Should_Not_Handle_Unmapped_Exceptions()
    {
        var httpContext = new DefaultHttpContext();

        var handled = await _handler.TryHandleAsync(httpContext, new Exception("unrelated"), CancellationToken.None);

        handled.Should().BeFalse();
    }
}

using AltitudELog.Application.Auth.Commands.ForgotPassword;
using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Auth.Commands.Register;
using AltitudELog.Application.Auth.Commands.ResetPassword;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<ActionResult<Guid>> Register(RegisterCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return Ok(id);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}

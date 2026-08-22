using AltitudELog.Application.Common.Behaviors;
using AwesomeAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Common.Behaviors;

public class ValidationBehaviorTests
{
    public record TestCommand(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_Should_Throw_ValidationException_When_A_Validator_Fails()
    {
        var validator = Substitute.For<IValidator<TestCommand>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<TestCommand>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Name is required.")]));

        var behavior = new ValidationBehavior<TestCommand, string>([validator]);

        var act = () => behavior.Handle(new TestCommand(""), _ => Task.FromResult("handled"), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_Should_Call_Next_When_All_Validators_Pass()
    {
        var validator = Substitute.For<IValidator<TestCommand>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<TestCommand>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var behavior = new ValidationBehavior<TestCommand, string>([validator]);

        var result = await behavior.Handle(
            new TestCommand("valid"), _ => Task.FromResult("handled"), CancellationToken.None);

        result.Should().Be("handled");
    }

    [Fact]
    public async Task Handle_Should_Call_Next_When_No_Validators_Registered()
    {
        var behavior = new ValidationBehavior<TestCommand, string>([]);

        var result = await behavior.Handle(
            new TestCommand("anything"), _ => Task.FromResult("handled"), CancellationToken.None);

        result.Should().Be("handled");
    }
}

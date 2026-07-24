using AltitudELog.Application.Common.Behaviors;
using AwesomeAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Common.Behaviors;

public class ValidationBehaviorTests
{
    // Public (not private/nested-private) because ValidationBehavior substitutes
    // IValidator<TRequest>, and NSubstitute/Castle DynamicProxy needs to generate a proxy over
    // that closed generic type — which requires TRequest to be an accessible (public) type.
    public record TestCommand(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_Should_Throw_ValidationException_When_A_Validator_Fails()
    {
        var validator = Substitute.For<IValidator<TestCommand>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<TestCommand>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Name is required.")]));

        var behavior = new ValidationBehavior<TestCommand, string>([validator]);

        var act = () => behavior.Handle(new TestCommand(""), () => Task.FromResult("handled"), CancellationToken.None);

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
            new TestCommand("valid"), () => Task.FromResult("handled"), CancellationToken.None);

        result.Should().Be("handled");
    }

    [Fact]
    public async Task Handle_Should_Call_Next_When_No_Validators_Registered()
    {
        var behavior = new ValidationBehavior<TestCommand, string>([]);

        var result = await behavior.Handle(
            new TestCommand("anything"), () => Task.FromResult("handled"), CancellationToken.None);

        result.Should().Be("handled");
    }
}

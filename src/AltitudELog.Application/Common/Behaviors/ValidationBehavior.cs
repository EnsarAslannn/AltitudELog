using FluentValidation;
using MediatR;

namespace AltitudELog.Application.Common.Behaviors;

// The constraint is `notnull`, not `IRequest<TResponse>`: MediatR 12's non-generic `IRequest`
// (used by void commands like UpdateFlight/ResetPassword) derives from `IBaseRequest`, NOT from
// `IRequest<Unit>`. With an `IRequest<TResponse>` constraint the DI container silently fails the
// constraint check when closing this open generic over `<TVoidCommand, Unit>` and registers no
// behavior at all — so every void command would bypass the whole pipeline unvalidated.
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);

        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(result => result.Errors)
            .Where(failure => failure is not null)
            .ToList();

        if (failures.Count != 0)
        {
            throw new ValidationException(failures);
        }

        return await next();
    }
}

using Application.ErrorHandling;
using FluentValidation;
using MediatR;
using System.Reflection;

namespace Application.Common.Behavior
{
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private readonly IEnumerable<IValidator<TRequest>> _validators;

        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            if (!_validators.Any())
            {
                return await next();
            }

            var context = new ValidationContext<TRequest>(request);
            var validationResults = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

            var failures = validationResults
                .Where(r => r.Errors.Any())
                .SelectMany(r => r.Errors)
                .ToList();

            if (!failures.Any())
            {
                return await next();
            }

            var errorMessage = string.Join("; ", failures.Select(f => f.ErrorMessage).Distinct());
            return CreateValidationResult(Errors.ValidationFailed(errorMessage));
        }

        private static TResponse CreateValidationResult(Error error)
        {
            if (!typeof(Result).IsAssignableFrom(typeof(TResponse)))
            {
                throw new ValidationException(error.Description);
            }

            var failureMethod = typeof(TResponse)
                .GetMethods(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .FirstOrDefault(method =>
                    method.Name == nameof(Result.Failure) &&
                    method.GetParameters() is [{ ParameterType: var parameterType }] &&
                    parameterType == typeof(Error));

            if (failureMethod is null)
            {
                throw new InvalidOperationException($"Type {typeof(TResponse).Name} does not expose Failure(Error).");
            }

            return (TResponse)failureMethod.Invoke(null, new object[] { error })!;
        }
    }
}

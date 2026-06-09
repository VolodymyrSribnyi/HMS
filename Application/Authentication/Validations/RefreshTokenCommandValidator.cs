using Application.Authentication.Commands;
using FluentValidation;

namespace Application.Authentication.Validations
{
    public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
    {
        public RefreshTokenCommandValidator()
        {
            RuleFor(command => command.RefreshToken)
                .NotEmpty().WithMessage("The refresh token must be specified.");
        }
    }
}

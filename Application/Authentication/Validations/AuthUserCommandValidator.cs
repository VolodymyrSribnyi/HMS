using Application.Authentication.Commands;
using FluentValidation;

namespace Application.Authentication.Validations
{
    public class AuthUserCommandValidator : AbstractValidator<AuthUserCommand>
    {
        public AuthUserCommandValidator()
        {
            RuleFor(command => command.Email)
                .NotEmpty().WithMessage("The email must be specified.")
                .EmailAddress().WithMessage("The email format is invalid.");

            RuleFor(command => command.Password)
                .NotEmpty().WithMessage("The password must be specified.");
        }
    }
}

using Application.Authentication.Commands;
using FluentValidation;

namespace Application.Authentication.Validations
{
    public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
    {
        public CreateUserCommandValidator()
        {
            RuleFor(command => command.FirstName)
                .NotEmpty().WithMessage("The first name must be specified.")
                .MaximumLength(100).WithMessage("The first name must not exceed 100 characters.");

            RuleFor(command => command.LastName)
                .NotEmpty().WithMessage("The last name must be specified.")
                .MaximumLength(100).WithMessage("The last name must not exceed 100 characters.");

            RuleFor(command => command.UserName)
                .NotEmpty().WithMessage("The username must be specified.")
                .MaximumLength(100).WithMessage("The username must not exceed 100 characters.");

            RuleFor(command => command.Email)
                .NotEmpty().WithMessage("The email must be specified.")
                .EmailAddress().WithMessage("The email format is invalid.")
                .MaximumLength(256).WithMessage("The email must not exceed 256 characters.");

            RuleFor(command => command.Password)
                .NotEmpty().WithMessage("The password must be specified.")
                .MinimumLength(8).WithMessage("The password must contain at least 8 characters.");

            RuleFor(command => command.Roles)
                .NotNull().WithMessage("At least one role must be specified.")
                .Must(roles => roles is not null && roles.Any(role => !string.IsNullOrWhiteSpace(role)))
                .WithMessage("At least one role must be specified.");
        }
    }
}

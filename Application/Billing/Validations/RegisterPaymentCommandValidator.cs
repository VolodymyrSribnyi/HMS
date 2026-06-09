using Application.Billing.Commands;
using FluentValidation;

namespace Application.Billing.Validations
{
    public class RegisterPaymentCommandValidator : AbstractValidator<RegisterPaymentCommand>
    {
        public RegisterPaymentCommandValidator()
        {
            RuleFor(command => command.InvoiceId)
                .NotEmpty().WithMessage("The invoice id must be specified.");

            RuleFor(command => command.Amount)
                .GreaterThan(0).WithMessage("The payment amount must be greater than 0.");

            RuleFor(command => command.PaymentMethod)
                .NotEmpty().WithMessage("The payment method must be specified.")
                .MaximumLength(50).WithMessage("The payment method must not exceed 50 characters.");
        }
    }
}

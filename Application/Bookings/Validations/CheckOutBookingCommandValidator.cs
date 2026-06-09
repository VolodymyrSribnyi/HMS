using Application.Bookings.Commands;
using FluentValidation;

namespace Application.Bookings.Validations
{
    public class CheckOutBookingCommandValidator : AbstractValidator<CheckOutBookingCommand>
    {
        public CheckOutBookingCommandValidator()
        {
            RuleFor(command => command.BookingId)
                .NotEmpty().WithMessage("The booking id must be specified.");

            RuleFor(command => command.Discount)
                .GreaterThanOrEqualTo(0).WithMessage("The discount cannot be negative.");
        }
    }
}

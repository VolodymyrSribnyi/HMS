using Application.Bookings.Commands;
using FluentValidation;

namespace Application.Bookings.Validations
{
    public class CheckInBookingCommandValidator : AbstractValidator<CheckInBookingCommand>
    {
        public CheckInBookingCommandValidator()
        {
            RuleFor(command => command.BookingId)
                .NotEmpty().WithMessage("The booking id must be specified.");

            RuleFor(command => command.RoomId)
                .NotEmpty().WithMessage("The room must be specified.");
        }
    }
}

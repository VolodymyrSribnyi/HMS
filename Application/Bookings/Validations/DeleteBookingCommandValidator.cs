using Application.Bookings.Commands;
using FluentValidation;

namespace Application.Bookings.Validations
{
    public class DeleteBookingCommandValidator : AbstractValidator<DeleteBookingCommand>
    {
        public DeleteBookingCommandValidator()
        {
            RuleFor(command => command.BookingId)
                .NotEmpty().WithMessage("The booking id must be specified.");

            RuleFor(command => command.GuestId)
                .NotEmpty().WithMessage("The guest must be specified.");
        }
    }
}

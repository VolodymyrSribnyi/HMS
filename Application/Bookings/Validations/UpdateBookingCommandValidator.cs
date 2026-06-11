using Application.Bookings.Commands;
using FluentValidation;

namespace Application.Bookings.Validations
{
    public class UpdateBookingCommandValidator : AbstractValidator<UpdateBookingCommand>
    {
        public UpdateBookingCommandValidator()
        {
            RuleFor(command => command.BookingId)
                .NotEmpty().WithMessage("The booking id must be specified.");

            RuleFor(command => command.GuestId)
                .NotEmpty().WithMessage("The guest must be specified.");

            RuleFor(command => command.RoomId)
                .NotEmpty().WithMessage("The room must be specified.");

            RuleFor(command => command.CheckInDate)
                .NotEmpty().WithMessage("The check-in date must be specified.");

            RuleFor(command => command.CheckOutDate)
                .NotEmpty().WithMessage("The check-out date must be specified.")
                .GreaterThan(command => command.CheckInDate)
                .WithMessage("The check-out date must be later than the check-in date.");
        }
    }
}

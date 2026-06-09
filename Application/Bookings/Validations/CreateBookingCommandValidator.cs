using Application.Bookings.Commands;
using FluentValidation;

namespace Application.Bookings.Validations
{
    public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
    {
        public CreateBookingCommandValidator()
        {
            RuleFor(command => command.RoomId)
                .NotEmpty().WithMessage("The room must be specified.");

            RuleFor(command => command.GuestId)
                .NotEmpty().WithMessage("The guest must be specified.");

            RuleFor(command => command.CheckInDate)
                .NotEmpty().WithMessage("The check-in date must be specified.")
                .Must(date => date.Date >= DateTime.UtcNow.Date)
                .WithMessage("The check-in date cannot be in the past.");

            RuleFor(command => command.CheckOutDate)
                .NotEmpty().WithMessage("The check-out date must be specified.")
                .GreaterThan(command => command.CheckInDate)
                .WithMessage("The check-out date must be later than the check-in date.");
        }
    }
}

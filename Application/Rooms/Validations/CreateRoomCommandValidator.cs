using Application.Rooms.Commands;
using Domain.Entities.Enums;
using FluentValidation;

namespace Application.Rooms.Validations
{
    public class CreateRoomCommandValidator : AbstractValidator<CreateRoomCommand>
    {
        public CreateRoomCommandValidator()
        {
            RuleFor(command => command.RoomNumber)
                .NotEmpty().WithMessage("The room number must be specified.")
                .MaximumLength(20).WithMessage("The room number must not exceed 20 characters.");

            RuleFor(command => command.Floor)
                .GreaterThanOrEqualTo(0).WithMessage("The floor cannot be negative.");

            RuleFor(command => command.Status)
                .NotEmpty().WithMessage("The room status must be specified.")
                .Must(status => Enum.TryParse<RoomStatus>(status, true, out _))
                .WithMessage("The room status is invalid.");

            RuleFor(command => command.RoomTypeId)
                .NotEmpty().WithMessage("The room type must be specified.");
        }
    }
}

using Application.RoomTypes.Commands;
using FluentValidation;

namespace Application.RoomTypes.Validations
{
    public class UpdateRoomTypeCommandValidator : AbstractValidator<UpdateRoomTypeCommand>
    {
        public UpdateRoomTypeCommandValidator()
        {
            RuleFor(command => command.Id)
                .NotEmpty().WithMessage("The room type id must be specified.");

            RuleFor(command => command.Name)
                .NotEmpty().WithMessage("The room type must be specified.")
                .MaximumLength(100).WithMessage("The name must not exceed 100 characters.");

            RuleFor(command => command.Capacity)
                .GreaterThan(0).WithMessage("The capacity must be greater than 0.");

            RuleFor(command => command.BasePrice)
                .GreaterThanOrEqualTo(0).WithMessage("The price cannot be negative.");
        }
    }
}

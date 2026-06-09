using Application.RoomTypes.Commands;
using FluentValidation;

namespace Application.RoomTypes.Validations
{
    public class DeleteRoomTypeCommandValidator : AbstractValidator<DeleteRoomTypeCommand>
    {
        public DeleteRoomTypeCommandValidator()
        {
            RuleFor(command => command.Id)
                .NotEmpty().WithMessage("The room type id must be specified.");
        }
    }
}

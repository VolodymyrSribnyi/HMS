using Application.Rooms.Commands;
using FluentValidation;

namespace Application.Rooms.Validations
{
    public class DeleteRoomCommandValidator : AbstractValidator<DeleteRoomCommand>
    {
        public DeleteRoomCommandValidator()
        {
            RuleFor(command => command.Id)
                .NotEmpty().WithMessage("The room id must be specified.");

            RuleFor(command => command.RowVersion)
                .NotEmpty().WithMessage("The row version must be specified.");
        }
    }
}

using FluentValidation;
using RoomTypes.Commands;
using System;
using System.Collections.Generic;
using System.Text;

namespace RoomTypes.Validations
{
    public class CreateRoomTypeCommandValidator : AbstractValidator<CreateRoomTypeCommand>
    {
        public CreateRoomTypeCommandValidator()
        {
            RuleFor(v => v.Name)
                .NotEmpty().WithMessage("The room type must be specified.")
                .MaximumLength(100).WithMessage("The name must not exceed 100 characters.");

            RuleFor(v => v.Capacity)
                .GreaterThan(0).WithMessage("The capacity must be greater than 0.");

            RuleFor(v => v.BasePrice)
                .GreaterThanOrEqualTo(0).WithMessage("The price cannot be negative.");
        }
    }
}

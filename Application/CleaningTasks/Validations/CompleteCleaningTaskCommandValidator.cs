using Application.CleaningTasks.Commands;
using FluentValidation;

namespace Application.CleaningTasks.Validations
{
    public class CompleteCleaningTaskCommandValidator : AbstractValidator<CompleteCleaningTaskCommand>
    {
        public CompleteCleaningTaskCommandValidator()
        {
            RuleFor(command => command.CleaningTaskId)
                .NotEmpty().WithMessage("The cleaning task id must be specified.");
        }
    }
}

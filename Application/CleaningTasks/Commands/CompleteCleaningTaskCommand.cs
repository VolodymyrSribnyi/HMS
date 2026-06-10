using Application.ErrorHandling;
using MediatR;

namespace Application.CleaningTasks.Commands
{
    public record CompleteCleaningTaskCommand : IRequest<Result>
    {
        public Guid CleaningTaskId { get; set; }
    }
}

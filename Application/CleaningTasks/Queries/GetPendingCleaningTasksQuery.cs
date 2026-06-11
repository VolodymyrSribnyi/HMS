using Application.DTOs.CleaningTask;
using Application.ErrorHandling;
using MediatR;

namespace Application.CleaningTasks.Queries
{
    public class GetPendingCleaningTasksQuery : IRequest<Result<IEnumerable<GetCleaningTaskDTO>>>
    {
    }
}

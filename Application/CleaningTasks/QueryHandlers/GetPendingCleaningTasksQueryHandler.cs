using Application.CleaningTasks.Queries;
using Application.Common.Interfaces;
using Application.DTOs.CleaningTask;
using Application.ErrorHandling;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.CleaningTasks.QueryHandlers
{
    public class GetPendingCleaningTasksQueryHandler : IRequestHandler<GetPendingCleaningTasksQuery, Result<IEnumerable<GetCleaningTaskDTO>>>
    {
        private readonly IHmsDbContext _context;

        public GetPendingCleaningTasksQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetCleaningTaskDTO>>> Handle(GetPendingCleaningTasksQuery request, CancellationToken cancellationToken)
        {
            var tasks = await _context.CleaningTasks
                .AsNoTracking()
                .Where(task => task.Status == CleaningTaskStatus.Pending || task.Status == CleaningTaskStatus.InProgress)
                .Join(
                    _context.Rooms.AsNoTracking().Include(room => room.RoomType),
                    task => task.RoomId,
                    room => room.Id,
                    (task, room) => new GetCleaningTaskDTO
                    {
                        Id = task.Id,
                        Status = task.Status.ToString(),
                        CreatedAt = task.CreatedAt,
                        RoomId = task.RoomId,
                        RoomNumber = room.RoomNumber,
                        Floor = room.Floor,
                        RoomTypeName = room.RoomType.Name,
                        AssignedMaidId = task.AssignedMaidId
                    })
                .OrderBy(task => task.Floor)
                .ThenBy(task => task.RoomNumber)
                .ToListAsync(cancellationToken);

            return Result<IEnumerable<GetCleaningTaskDTO>>.Success(tasks);
        }
    }
}

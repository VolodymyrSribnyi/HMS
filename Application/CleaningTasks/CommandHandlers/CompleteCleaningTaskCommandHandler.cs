using Application.CleaningTasks.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.CleaningTasks.CommandHandlers
{
    public class CompleteCleaningTaskCommandHandler : IRequestHandler<CompleteCleaningTaskCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public CompleteCleaningTaskCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(CompleteCleaningTaskCommand request, CancellationToken cancellationToken)
        {
            var task = await _context.CleaningTasks
                .FirstOrDefaultAsync(task => task.Id == request.CleaningTaskId, cancellationToken);

            if (task is null)
            {
                return Result.Failure(Errors.CleaningTaskNotFound);
            }

            if (task.Status == CleaningTaskStatus.Completed)
            {
                return Result.Failure(Errors.InvalidCleaningTaskStatus);
            }

            var room = await _context.Rooms
                .FirstOrDefaultAsync(room => room.Id == task.RoomId, cancellationToken);

            if (room is null)
            {
                return Result.Failure(Errors.RoomNotFound);
            }

            if (room.Status != RoomStatus.NeedsCleaning)
            {
                return Result.Failure(Errors.InvalidRoomStatus);
            }

            task.Complete();
            room.MarkAvailable();

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return Result.Success();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result.Failure(Errors.ConcurrencyConflict);
            }
        }
    }
}

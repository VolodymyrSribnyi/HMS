using Application.Common.Events;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Entities.Enums;
using Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Housekeeping.EventHandlers
{
    public class HousekeepingEventHandler : INotificationHandler<DomainEventNotification<BookingCheckedOutEvent>>
    {
        private readonly IHmsDbContext _context;

        public HousekeepingEventHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task Handle(DomainEventNotification<BookingCheckedOutEvent> notification, CancellationToken cancellationToken)
        {
            var domainEvent = notification.DomainEvent;

            var room = await _context.Rooms
                .FirstOrDefaultAsync(room => room.Id == domainEvent.RoomId, cancellationToken);

            if (room is null)
            {
                return;
            }

            room.MarkNeedsCleaning();

            var hasOpenCleaningTask = await _context.CleaningTasks
                .AnyAsync(task =>
                    task.RoomId == domainEvent.RoomId &&
                    task.Status != CleaningTaskStatus.Completed,
                    cancellationToken);

            if (hasOpenCleaningTask)
            {
                return;
            }

            await _context.CleaningTasks.AddAsync(
                CleaningTask.CreatePending(domainEvent.RoomId),
                cancellationToken);
        }
    }
}

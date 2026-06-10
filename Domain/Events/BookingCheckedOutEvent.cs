using Domain.Common;

namespace Domain.Events
{
    public sealed record BookingCheckedOutEvent(Guid BookingId, Guid RoomId) : IDomainEvent;
}

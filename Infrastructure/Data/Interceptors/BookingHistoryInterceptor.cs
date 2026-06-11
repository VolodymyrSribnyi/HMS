using System.Security.Claims;
using Domain.Entities;
using Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Infrastructure.Data.Interceptors
{
    public class BookingHistoryInterceptor : SaveChangesInterceptor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BookingHistoryInterceptor(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData,
            InterceptionResult<int> result)
        {
            AddBookingHistoryEntries(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            AddBookingHistoryEntries(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void AddBookingHistoryEntries(DbContext? context)
        {
            if (context is null)
            {
                return;
            }

            var changedBookings = context.ChangeTracker
                .Entries<Booking>()
                .Where(HasStatusChanged)
                .ToList();

            if (changedBookings.Count == 0)
            {
                return;
            }

            var userId = GetCurrentUserId();

            foreach (var entry in changedBookings)
            {
                context.Set<BookingHistory>().Add(new BookingHistory
                {
                    Id = Guid.NewGuid(),
                    BookingId = entry.Entity.Id,
                    OldStatus = (BookingStatus)entry.Property(BookingStatusPropertyName).OriginalValue!,
                    NewStatus = (BookingStatus)entry.Property(BookingStatusPropertyName).CurrentValue!,
                    ChangedAt = DateTime.UtcNow,
                    ChangedByUserId = userId
                });
            }
        }

        private static bool HasStatusChanged(EntityEntry<Booking> entry)
        {
            if (entry.State != EntityState.Modified)
            {
                return false;
            }

            var statusProperty = entry.Property(BookingStatusPropertyName);
            return statusProperty.IsModified &&
                !Equals(statusProperty.OriginalValue, statusProperty.CurrentValue);
        }

        private Guid? GetCurrentUserId()
        {
            var userIdValue =
                _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                _httpContextAccessor.HttpContext?.User.FindFirstValue("UserId");

            return Guid.TryParse(userIdValue, out var userId)
                ? userId
                : null;
        }

        private const string BookingStatusPropertyName = nameof(Booking.Status);
    }
}

using Application.Common.Interfaces;
using Application.ErrorHandling;
using Azure.Core;
using Domain.Entities.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly IHmsDbContext _context;
        public BookingRepository(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsRoomAvailableAsync(Guid roomId, DateTime checkInDate, DateTime checkOutDate, Guid? excludeBookingId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Bookings
                .Where(b => b.AssignedRoomId == roomId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.CheckedOut &&
                        b.CheckInDate < checkOutDate &&
                        b.CheckOutDate > checkInDate);

            // Якщо передано ID бронювання (наприклад, при оновленні), виключаємо його з пошуку
            if (excludeBookingId.HasValue)
            {
                query = query.Where(b => b.Id != excludeBookingId.Value);
            }

            bool isOccupied = await query.AnyAsync(cancellationToken);

            return !isOccupied;
        }
        public async Task<bool> IsBookingDateInPast(DateTime checkInDate, DateTime checkOutDate)
        {
            if (checkInDate < DateTime.UtcNow.Date)
                return true;
            return false;
        }
        public async Task<bool> IsBookingCheckInDateLaterThanCheckOut(DateTime checkInDate, DateTime checkOutDate)
        {
            if (checkOutDate <= checkInDate)
                return true;
            return false;
        }
    }
}

using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace Application.Bookings.CommandHandlers
{
    public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Result<Guid>>
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IHmsDbContext _context;

        public CreateBookingCommandHandler(IBookingRepository bookingRepository, IHmsDbContext context)
        {
            _bookingRepository = bookingRepository;
            _context = context;
        }
        public async Task<Result<Guid>> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
        {
            if (request.CheckInDate.Date < DateTime.UtcNow.Date)
                return Result<Guid>.Failure(Errors.BookingDateInPast);

            if (request.CheckOutDate <= request.CheckInDate)
                return Result<Guid>.Failure(Errors.BookingCheckInDateLaterThanCheckOut);

            bool isAvailable = await _bookingRepository.IsRoomAvailableAsync(request.RoomId, request.CheckInDate, request.CheckOutDate,null, cancellationToken);
            
            if (!isAvailable)
                return Result<Guid> .Failure(Errors.RoomIsBooked);

            var guestExists = await _context.UserProfiles
                .AnyAsync(u => u.Id == request.GuestId, cancellationToken);

            if (!guestExists)
            {
                // Повертаємо чисту бізнес-помилку (Result Pattern), замість падіння бази
                return Result<Guid>.Failure(Errors.UserNotFound);
            }
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);

            if (room == null)
                return Result<Guid>.Failure(Errors.RoomNotFound);

            decimal totalPrice = room.CalculateTotalPrice(request.CheckInDate, request.CheckOutDate);
            var booking = Booking.Create(request.CheckInDate, request.CheckOutDate, totalPrice, request.GuestId, room.RoomTypeId);

            await _context.Bookings.AddAsync(booking, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(booking.Id);
        }
    }
}

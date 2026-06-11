using Application.Bookings.Queries;
using Application.Common.Interfaces;
using Application.DTOs.Booking;
using Application.ErrorHandling;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.QueryHandlers
{
    public class GetBookingByIdQueryHandler : IRequestHandler<GetBookingByIdQuery, Result<GetBookingDTO>>
    {
        private readonly IHmsDbContext _context;

        public GetBookingByIdQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<GetBookingDTO>> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.Id == request.BookingId)
                .Select(b => new GetBookingDTO
                {
                    Id = b.Id,
                    CheckInDate = b.CheckInDate,
                    CheckOutDate = b.CheckOutDate,
                    Status = b.Status,
                    TotalPrice = b.TotalPrice,
                    RoomTypeName = b.RoomType.Name,
                    AssignedRoomId = b.AssignedRoomId,
                    AssignedRoomNumber = b.AssignedRoom != null ? b.AssignedRoom.RoomNumber : null,
                    GuestId = b.GuestId,
                    GuestFullName = b.Guest != null ? (b.Guest.FirstName + " " + b.Guest.LastName).Trim() : null,
                    InvoiceId = b.Invoice != null ? b.Invoice.Id : null,
                    InvoiceTotalAmount = b.Invoice != null ? b.Invoice.TotalAmount : null,
                    InvoicePaidAmount = b.Invoice != null ? b.Invoice.Payments.Sum(payment => payment.Amount) : null,
                    InvoiceRemainingAmount = b.Invoice != null ? b.Invoice.TotalAmount - b.Invoice.Payments.Sum(payment => payment.Amount) : null,
                    InvoiceIsClosed = b.Invoice != null ? b.Invoice.IsClosed : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (booking is null)
            {
                return Result<GetBookingDTO>.Failure(Errors.BookingNotFound);
            }

            if (!request.CanViewAllBookings && booking.GuestId != request.RequesterId)
            {
                return Result<GetBookingDTO>.Failure(Errors.UnauthorizedBookingAccess);
            }

            return Result<GetBookingDTO>.Success(booking);
        }
    }
}

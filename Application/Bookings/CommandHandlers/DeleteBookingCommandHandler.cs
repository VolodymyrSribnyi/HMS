using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.CommandHandlers
{
    public class DeleteBookingCommandHandler : IRequestHandler<DeleteBookingCommand, Result<bool>>
    {
        private readonly IHmsDbContext _context;

        public DeleteBookingCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<bool>> Handle(DeleteBookingCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .Include(b => b.AssignedRoom)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

            if (booking == null)
                return Result<bool>.Failure(Errors.BookingNotFound);

            if (booking.GuestId != request.GuestId)
                return Result<bool>.Failure(Errors.UnauthorizedBookingAccess);

            if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
                return Result<bool>.Failure(Errors.InvalidBookingStatus);

            booking.Cancel(request.CancellationReason);

            if (booking.AssignedRoom != null)
            {
                _context.Entry(booking.AssignedRoom).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
    }
}

using Application.Bookings.Queries;
using Application.Common.Interfaces;
using Application.DTOs.Booking;
using Application.ErrorHandling;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.QueryHandlers
{
    public class GetGuestsBookingsQueryHandler : IRequestHandler<GetGuestsBookingsQuery, Result<IEnumerable<GetBookingDTO>>>
    {
        private readonly IHmsDbContext _context;
        private readonly IMapper _mapper;
        public GetGuestsBookingsQueryHandler(IHmsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<Result<IEnumerable<GetBookingDTO>>> Handle(GetGuestsBookingsQuery request, CancellationToken cancellationToken)
        {
            var bookings = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.GuestId == request.GuestId)
                .OrderByDescending(b => b.CheckInDate)
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
                    GuestFullName = b.Guest != null ? (b.Guest.FirstName + " " + b.Guest.LastName).Trim() : null
                })
                .ToListAsync(cancellationToken);

            return Result<IEnumerable<GetBookingDTO>>.Success(bookings);
        }
    }
}

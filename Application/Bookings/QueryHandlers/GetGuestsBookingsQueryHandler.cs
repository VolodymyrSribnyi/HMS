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
            .Include(b => b.RoomType)
            .Where(b => b.GuestId == request.GuestId)
            .OrderByDescending(b => b.CheckInDate)
            //.ProjectTo<GetBookingDTO>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

            var bookingsDto = _mapper.Map<List<GetBookingDTO>>(bookings);

            return Result<IEnumerable<GetBookingDTO>>.Success(bookingsDto);
        }
    }
}

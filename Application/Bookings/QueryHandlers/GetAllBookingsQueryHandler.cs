using Application.Bookings.Queries;
using Application.Common.Interfaces;
using Application.DTOs.Booking;
using Application.DTOs.RoomType;
using Application.ErrorHandling;
using AutoMapper;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.QueryHandlers
{
    public class GetAllBookingsQueryHandler : IRequestHandler<GetAllBookingsQuery, Result<IEnumerable<GetBookingDTO>>>
    {
        private readonly IHmsDbContext _context;
        private readonly IMapper _mapper;
        public GetAllBookingsQueryHandler(IHmsDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<IEnumerable<GetBookingDTO>>> Handle(GetAllBookingsQuery request, CancellationToken cancellationToken)
        {
            var bookings = await _context.Bookings
                .AsNoTracking()
                .Include(b => b.RoomType)
                .ToListAsync(cancellationToken);

            if (bookings == null)
            {
                return Result<IEnumerable<GetBookingDTO>>.Failure(Errors.NullData);
            }

            var bookingsDTO = _mapper.Map<IEnumerable<GetBookingDTO>>(bookings);

            return Result<IEnumerable<GetBookingDTO>>.Success(bookingsDTO);
        }
    }
}

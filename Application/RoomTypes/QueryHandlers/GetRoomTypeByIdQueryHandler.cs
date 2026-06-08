using Application.Common.Interfaces;
using Application.DTOs.RoomType;
using Application.ErrorHandling;
using Application.RoomTypes.Queries;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.QueryHandlers
{
    public class GetRoomTypeByIdQueryHandler : IRequestHandler<GetRoomTypeByIdQuery, Result<GetRoomTypeDTO>>
    {
        private readonly IHmsDbContext _context;
        private readonly IMapper _mapper;
        public GetRoomTypeByIdQueryHandler(IHmsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<GetRoomTypeDTO>> Handle(GetRoomTypeByIdQuery request, CancellationToken cancellationToken)
        {
            var roomType = await _context.RoomTypes
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (roomType == null)
                return Result<GetRoomTypeDTO>.Failure(Errors.RoomTypeNotFound);

            var roomTypeDTO = _mapper.Map<GetRoomTypeDTO>(roomType);

            return Result<GetRoomTypeDTO>.Success(roomTypeDTO);
        }
    }
}
    
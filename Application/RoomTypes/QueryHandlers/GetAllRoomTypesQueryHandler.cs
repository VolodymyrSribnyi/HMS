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
    public class GetAllRoomTypesQueryHandler : IRequestHandler<GetAllRoomTypesQuery, Result<IEnumerable<GetRoomTypeDTO>>>
    {
        private readonly IHmsDbContext _context;
        private readonly IMapper _mapper;
        public GetAllRoomTypesQueryHandler(IHmsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<Result<IEnumerable<GetRoomTypeDTO>>> Handle(GetAllRoomTypesQuery request, CancellationToken cancellationToken)
        {
            var roomTypes =  await _context.RoomTypes
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

            if (roomTypes == null)
            {
                return Result<IEnumerable<GetRoomTypeDTO>>.Failure(Errors.NullData);
            }

            var roomTypesDTO = _mapper.Map<IEnumerable<GetRoomTypeDTO>>(roomTypes);

            return Result<IEnumerable<GetRoomTypeDTO>>.Success(roomTypesDTO);
        }
    }
}

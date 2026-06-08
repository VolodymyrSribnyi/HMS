using Application.DTOs.RoomType;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.Queries
{
    public record GetRoomTypeByIdQuery : IRequest<Result<GetRoomTypeDTO>>
    {
        public Guid Id { get; set; }
    }
}

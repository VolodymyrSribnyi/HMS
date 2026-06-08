using Application.DTOs.RoomType;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace RoomTypes.Commands
{
    public record CreateRoomTypeCommand : IRequest<Result<Guid>>
    {
        public string Name { get; set; }
        public int Capacity { get; set; }
        public decimal BasePrice { get; set; }
        public string? Description { get; set; }
        public string? Amenities { get; set; }
    }
}

using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.Commands
{
    public record UpdateRoomTypeCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Capacity { get; set; }
        public decimal BasePrice { get; set; }
        public string? Description { get; set; }
        public string? Amenities { get; set; }
    }
}

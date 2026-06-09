using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.RoomType
{
    public record GetRoomTypeDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Capacity { get; set; }
        public decimal BasePrice { get; set; }
        public string Description { get; set; }
        public string Amenities { get; set; }
    }
}

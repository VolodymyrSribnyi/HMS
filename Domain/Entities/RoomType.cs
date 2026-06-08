using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class RoomType
    {
        private RoomType() { }
        public static RoomType Create(string name, int capacity, decimal basePrice, string? description, string? amenities)
        {
            return new RoomType
            {
                Id = Guid.NewGuid(),
                Name = name,
                Capacity = capacity,
                BasePrice = basePrice,
                Description = description,
                Amenities = amenities
            };
        }
        public void Update(string name, int capacity, decimal basePrice, string? description, string? amenities)
        {
            Name = name;
            Capacity = capacity;
            BasePrice = basePrice;
            Description = description;
            Amenities = amenities;
        }
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Capacity { get; set; }
        public decimal BasePrice { get; set; }
        public string Description { get; set; }
        public string Amenities { get; set; }
        public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}

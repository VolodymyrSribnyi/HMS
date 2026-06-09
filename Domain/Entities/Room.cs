using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Room
    {
        public static Room Create(string roomNumber, int floor, RoomStatus status, Guid roomTypeId)
        {
            return new Room
            {
                Id = Guid.NewGuid(),
                RoomNumber = roomNumber,
                Floor = floor,
                Status = status,
                RoomTypeId = roomTypeId
            };
        }

        public void Update(string roomNumber, int floor, RoomStatus status, Guid roomTypeId)
        {
            RoomNumber = roomNumber;
            Floor = floor;
            Status = status;
            RoomTypeId = roomTypeId;
        }

        public Guid Id { get; set; }
        public string RoomNumber { get; set; }
        public int Floor { get; set; }
        public RoomStatus Status {  get; set; }
        public Guid RoomTypeId { get; set; }
        public virtual RoomType RoomType { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<CleaningTask> CleaningTasks { get; set; } = new List<CleaningTask>();
        public byte[] Version { get; set; }
        public decimal CalculateTotalPrice(DateTime checkIn,DateTime checkOut)
        {
            if (checkOut <= checkIn)
                return 0;

            int days = (checkOut.Date - checkIn.Date).Days;

            return days * RoomType.BasePrice;
        }
    }
}

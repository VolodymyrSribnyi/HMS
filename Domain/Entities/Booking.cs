using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Booking
    {
        public static Booking Create(Guid roomId, DateTime chekInDate, DateTime chekOutDate, decimal totalPrice, Guid guestId, Guid roomTypeId)
        {
            return new Booking
            {
                Id = Guid.NewGuid(),
                CheckInDate = chekInDate,
                CheckOutDate = chekOutDate,
                Status = BookingStatus.Pending,
                TotalPrice = totalPrice,
                CreatedAt = DateTime.Now,
                GuestId = guestId,
                RoomTypeId = roomTypeId,
                AssignedRoomId = roomId,
            };
        }
        public void Update(Guid roomId, DateTime chekInDate, DateTime chekOutDate, decimal totalPrice, Guid roomTypeId)
        {
            CheckInDate = chekInDate;
            CheckOutDate = chekOutDate;
            TotalPrice = totalPrice;
            RoomTypeId = roomTypeId;
            AssignedRoomId = roomId;
        }
        public Guid Id { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public BookingStatus Status { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public Guid GuestId { get; set; }
        public UserProfile Guest { get; set; }
        public Guid RoomTypeId { get; set; }
        public RoomType RoomType { get; set; }
        public Guid? AssignedRoomId { get; set; }
        public Room? AssignedRoom { get; set; }
        public virtual Invoice Invoice { get; set; }
        public virtual ICollection<BookingHistory> History { get; set; } = new List<BookingHistory>();
    }
}

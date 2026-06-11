using Domain.Entities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Booking
{
    public record GetBookingDTO
    {
        public Guid Id { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public BookingStatus Status { get; set; }
        public decimal TotalPrice { get; set; }
        public string RoomTypeName { get; set; }
        public Guid? AssignedRoomId { get; set; }
        public string? AssignedRoomNumber { get; set; }
        public Guid GuestId { get; set; }
        public string? GuestFullName { get; set; }
        public Guid? InvoiceId { get; set; }
        public decimal? InvoiceTotalAmount { get; set; }
        public decimal? InvoicePaidAmount { get; set; }
        public decimal? InvoiceRemainingAmount { get; set; }
        public bool? InvoiceIsClosed { get; set; }
    }
}

namespace Application.DTOs.Billing
{
    public record InvoiceDTO
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string RoomTypeName { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int Nights { get; set; }
        public decimal BaseAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public bool IsClosed { get; set; }
    }
}

namespace Application.DTOs.Billing
{
    public record PaymentDTO
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public decimal RemainingAmount { get; set; }
        public bool IsInvoiceClosed { get; set; }
    }
}

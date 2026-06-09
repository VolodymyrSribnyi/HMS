using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Invoice
    {
        public static Invoice Create(Guid bookingId, decimal totalAmount, decimal discount)
        {
            return new Invoice
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                TotalAmount = totalAmount,
                Discount = discount,
                IsClosed = totalAmount == 0
            };
        }

        public void Close()
        {
            IsClosed = true;
        }

        public Guid Id { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount {  get; set; }
        public bool IsClosed { get; set; }
        public Guid BookingId { get; set; }
        public virtual Booking Booking { get; set; }
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}


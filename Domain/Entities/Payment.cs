using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Payment
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; }
        public DateTime PaymentDate { get; set; }
        public Guid InvoiceId { get; set; }
        public virtual Invoice Invoice { get; set; }
    }
}

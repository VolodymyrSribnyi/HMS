using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class BookingHistory
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public BookingStatus OldStatus { get; set; }
        public BookingStatus NewStatus { get; set; }
        public DateTime ChangedAt { get; set; }
        public Guid? ChangedByUserId { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public string ActionType { get; set; }
        public string EntityName { get; set; }
        public string EntityId { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string IpAddress { get; set; }
        public Guid? UserId { get; set; }
    }
}

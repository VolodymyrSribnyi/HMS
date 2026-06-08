using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class CleaningTask
    {
        public Guid Id { get; set; }
        public CleaningTaskStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Guid RoomId { get; set; }
        public Guid? AssignedMaidId { get; set; }
        public virtual UserProfile? AssignedMaid { get; set; }
    }
}

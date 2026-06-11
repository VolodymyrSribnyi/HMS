namespace Application.DTOs.CleaningTask
{
    public record GetCleaningTaskDTO
    {
        public Guid Id { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid RoomId { get; set; }
        public string RoomNumber { get; set; }
        public int Floor { get; set; }
        public string RoomTypeName { get; set; }
        public Guid? AssignedMaidId { get; set; }
    }
}

namespace Application.DTOs.Room
{
    public record GetRoomDTO
    {
        public Guid Id { get; set; }
        public string RoomNumber { get; set; }
        public int Floor { get; set; }
        public string Status { get; set; }
        public Guid RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public decimal BasePrice { get; set; }
        public string RowVersion { get; set; }
    }
}

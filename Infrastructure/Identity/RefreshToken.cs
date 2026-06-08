namespace Infrastructure.Identity
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public string Token { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive => !IsRevoked && ExpiryDate > DateTime.UtcNow;
        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; }
    }
}

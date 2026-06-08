using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.User
{
    public record AuthResponseDTO
    {
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public IList<string> Roles { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }
}

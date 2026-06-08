using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Authentication
{
    public class TokenResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }
}

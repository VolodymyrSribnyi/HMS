using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Infrastructure.Identity
{
    public class JwtUtils : IJwtUtils
    {
        private readonly IConfiguration _configuration;
        public JwtUtils(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string GenerateToken(Guid userId, string fullName, string userName, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret is missing.");
            var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer is missing.");
            var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience is missing.");
            var expiryMinutes = Convert.ToDouble(jwtSettings["ExpiryMinutes"] ?? "120");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>()
        {
            new Claim(JwtRegisteredClaimNames.Sub, userName),
            new Claim(JwtRegisteredClaimNames.Jti, userId.ToString()),
            new Claim("Name", fullName),
            new Claim("UserId", userId.ToString()),
        };
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(expiryMinutes)),
                signingCredentials: signingCredentials
                );
            var encodedToken = new JwtSecurityTokenHandler().WriteToken(token);
            return encodedToken;
        }

        public List<string> ValidateToken(string token)
        {
            if (string.IsNullOrEmpty(token))
                return new List<string>();

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("JwtOptions") ?? throw new InvalidOperationException("JwtOptions not found.");

            var key = jwtSettings["Secret"] ?? throw new InvalidOperationException("'Secret' not found or empty.");

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);
            var jwtToken = (JwtSecurityToken)validatedToken;
            if (jwtToken != null)
            {
                var roles = new List<string>();
                foreach (var claim in jwtToken.Claims)
                {
                    if (claim.Type.ToLower() == "role")
                    {
                        roles.Add(claim.Value);
                    }
                }
                return roles;
            }
            // return user roles from JWT token if validation successful
            return new List<string>();
        }
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];

            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return Convert.ToBase64String(randomNumber);
        }
    }
}

using Application.Authentication;
using Application.DTOs.User;
using Application.ErrorHandling;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<Result> AddToRolesAsync(Guid userId, List<string> roles);
        Task<bool> IsInRoleAsync(Guid userId, string role);
        Task<Result<AuthResponseDTO>> AuthenticateAsync(string email, string password);
        Task<(Result Result, Guid UserId)> CreateUserAsync(string firstName,string lastName, string userName, string email, string password);
        Task<Result<TokenResponse>> GetRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    }
    public interface IJwtUtils
    {
        string GenerateToken(Guid userId, string fullName, string userName, IList<string> roles);
        string GenerateRefreshToken();
        List<string> ValidateToken(string token);
    }
}

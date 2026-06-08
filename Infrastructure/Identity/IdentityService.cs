using Application.Authentication;
using Application.Common.Interfaces;
using Application.DTOs.User;
using Application.ErrorHandling;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
namespace Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly HmsDbContext _dbContext;
        private readonly IJwtUtils _jwtUtils;
        public IdentityService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        IJwtUtils jwtUtils,
        HmsDbContext dbContext)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtUtils = jwtUtils;
            _dbContext = dbContext;
        }
        public async Task<Result> AddToRolesAsync(Guid userId, List<string> roles)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
            {
                return Result.Failure(Errors.UserNotFound);
            }

            foreach (var role in roles)
            {
                var roleExist = await _roleManager.RoleExistsAsync(role);
                if (!roleExist)
                {
                    await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
                }
            }
            var result = await _userManager.AddToRolesAsync(user, roles);

            if (result.Succeeded)
            {
                return Result.Success();
            }

            var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));

            return Result.Failure(new Error("Role.AddFailed", errorMsg));
        }

        public async Task<Result<AuthResponseDTO>> AuthenticateAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Result<AuthResponseDTO>.Failure(Errors.AuthInvalidCredentials);
            }
            var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
            if (!isPasswordValid)
                return Result<AuthResponseDTO>.Failure(Errors.AuthInvalidCredentials);

            var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == user.Id);
            var fullName = profile != null ? $"{profile.FirstName} {profile.LastName}" : user.UserName ?? "Guest";
            var tokenUserName = user.UserName ?? user.Email ?? user.Id.ToString();

            var roles = await _userManager.GetRolesAsync(user);
            var accessToken =  _jwtUtils.GenerateToken(user.Id, fullName, tokenUserName, roles);
            var refreshToken = _jwtUtils.GenerateRefreshToken();

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });
            await _dbContext.SaveChangesAsync(default);

            return Result<AuthResponseDTO>.Success(new AuthResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id
            });
        }

        public async Task<(Result Result, Guid UserId)> CreateUserAsync(string firstName, string lastName, string userName, string email, string password)
        {
            var userId = Guid.NewGuid();

            var user = new ApplicationUser
            {
                Id = userId,
                UserName = userName,
                Email = email
            };

            var profile = new UserProfile
            {
                Id = userId,
                FirstName = firstName,
                LastName = lastName
            };

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                return (Result.Failure(new Error("User.CreateFailed", errorMsg)), Guid.Empty);
            }

            _dbContext.UserProfiles.Add(profile);
            await _dbContext.SaveChangesAsync(default);

            return (Result.Success(), user.Id);

        }

        public bool UserExists(string email)
        {
            return _userManager.Users.Any(x => x.Email == email);
        }
        public async Task<bool> IsInRoleAsync(Guid userId, string role)
        {
            var user = _userManager.Users.SingleOrDefault(u => u.Id == userId);
            return user != null && await _userManager.IsInRoleAsync(user, role);
        }

        public async Task<Result<TokenResponse>> GetRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            var existingToken = await _dbContext.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);
            
            if (existingToken == null)
            {
                return Result<TokenResponse>.Failure(Errors.InvalidToken);
            
            }
            var user = existingToken.User;
            
            if (!existingToken.IsActive)
                return Result<TokenResponse>.Failure(Errors.TokenExpired);

            var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);
            var fullname = profile != null ? $"{profile.FirstName} {profile.LastName}" : user.UserName ?? "Guest";
            var tokenUserName = user.UserName ?? user.Email ?? user.Id.ToString();
            var roles = await _userManager.GetRolesAsync(user);

            var newAccessToken = _jwtUtils.GenerateToken(user.Id, fullname, tokenUserName,roles);
            var newRefreshToken = _jwtUtils.GenerateRefreshToken();

            existingToken.IsRevoked = true;
            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            });

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Result<TokenResponse>.Success(new TokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }
    }
}

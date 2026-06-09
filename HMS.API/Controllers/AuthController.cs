using Application.Authentication.Commands;
using Application.DTOs.User;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost("Register")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
        {
            var userId = await _mediator.Send(command);
            return Ok(new {UserId = userId, Message = "User is successfully created"});
        }
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] AuthUserCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.IsFailure)
            {
                return BadRequest(new { Error = response.Error.Description });
            }

            SetRefreshTokenCookie(response.Value.RefreshToken);

            return Ok(new
            {
                response.Value.UserId,
                response.Value.Name,
                response.Value.Email,
                response.Value.Roles,
                response.Value.AccessToken
            });
        }

        [HttpPost("Refresh")]
        public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return Unauthorized(new { Error = "Refresh token is missing." });
            }

            var response = await _mediator.Send(new RefreshTokenCommand
            {
                RefreshToken = refreshToken
            }, cancellationToken);

            if (response.IsFailure)
            {
                return Unauthorized(new { Error = response.Error.Description });
            }

            SetRefreshTokenCookie(response.Value.RefreshToken);

            return Ok(new
            {
                response.Value.AccessToken
            });
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/api/auth/refresh"
            });
        }
    }
}

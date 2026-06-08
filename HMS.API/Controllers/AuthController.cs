using Application.Authentication.Commands;
using Application.DTOs.User;
using MediatR;
using Microsoft.AspNetCore.Http;
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
            return Ok(response);
        }

    }
}

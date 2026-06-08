using Application.Bookings.Commands;
using Application.Bookings.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Тільки авторизований гість
    public class BookingController : ControllerBase
    {
        private readonly IMediator _mediator;

        public BookingController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        public async Task<IActionResult> Create(CreateBookingCommand command)
        {
            var userId = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid guestId))
            {
                return Unauthorized(new { Error = "The user could not be identified from the token." });
            }

            command.GuestId = guestId;
            var result = await _mediator.Send(command);

            return result.IsSuccess ? CreatedAtAction(nameof(Create), new { BookingId = result.Value}) : BadRequest(new { Error = result.Error.Description }); ;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var query = new GetAllBookingsQuery();
            var result = _mediator.Send(query);
            return result.Result.IsSuccess ? Ok(result.Result) : BadRequest();
        }
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            // Отримуємо UserId з токена (claims)
            var userId = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid guestId))
            {
                return Unauthorized(new { Error = "The user could not be identified from the token." });
            }

            var result = await _mediator.Send(new GetGuestsBookingsQuery { GuestId = guestId });
            return Ok(result);
        }
    }
}

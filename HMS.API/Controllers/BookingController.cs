using Application.Bookings.Commands;
using Application.Bookings.Queries;
using Application.ErrorHandling;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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

            var canCreateForGuest = User.IsInRole("Receptionist") || User.IsInRole("Admin");
            if (!canCreateForGuest || command.GuestId == Guid.Empty)
            {
                command.GuestId = guestId;
            }

            var result = await _mediator.Send(command);

            return result.IsSuccess
                ? CreatedAtAction(nameof(Create), new { BookingId = result.Value })
                : ToActionResult(result);
        }

        [HttpPost("{bookingId:guid}/check-in")]
        [Authorize(Roles = "Receptionist,Admin")]
        public async Task<IActionResult> CheckIn(Guid bookingId, [FromBody] CheckInBookingCommand command)
        {
            command.BookingId = bookingId;
            var result = await _mediator.Send(command);

            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpPost("{bookingId:guid}/check-out")]
        [Authorize(Roles = "Receptionist,Admin")]
        public async Task<IActionResult> CheckOut(Guid bookingId)
        {
            var result = await _mediator.Send(new CheckOutBookingCommand
            {
                BookingId = bookingId
            });

            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAllBookingsQuery());
            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid guestId))
            {
                return Unauthorized(new { Error = "The user could not be identified from the token." });
            }

            var result = await _mediator.Send(new GetGuestsBookingsQuery { GuestId = guestId });
            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        private IActionResult ToActionResult(Result result)
        {
            if (result.Error == Errors.BookingNotFound ||
                result.Error == Errors.RoomNotFound ||
                result.Error == Errors.UserNotFound)
            {
                return NotFound(new { Error = result.Error.Description });
            }

            if (result.Error == Errors.RoomIsBooked ||
                result.Error == Errors.RoomNotAvailable ||
                result.Error == Errors.RoomTypeMismatch ||
                result.Error == Errors.InvalidBookingStatus ||
                result.Error == Errors.ConcurrencyConflict)
            {
                return Conflict(new { Error = result.Error.Description });
            }

            return BadRequest(new { Error = result.Error.Description });
        }
    }
}

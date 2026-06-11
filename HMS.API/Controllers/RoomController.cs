using Application.ErrorHandling;
using Application.Rooms.Commands;
using Application.Rooms.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [Route("api/rooms")]
    [Authorize]
    [ApiController]
    public class RoomController : ControllerBase
    {
        private readonly IMediator _mediator;

        public RoomController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAllRoomsQuery());
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { Error = result.Error.Description });
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable([FromQuery] GetAvailableRoomsQuery query)
        {
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var result = await _mediator.Send(new GetRoomByIdQuery { Id = id });
            return result.IsSuccess ? Ok(result.Value) : NotFound(new { Error = result.Error.Description });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoomCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.IsFailure)
            {
                return ToActionResult(result);
            }

            return CreatedAtAction(nameof(Get), new { id = result.Value }, new { Id = result.Value });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoomCommand command)
        {
            command.Id = id;
            var result = await _mediator.Send(command);
            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, [FromQuery] string? rowVersion)
        {
            var result = await _mediator.Send(new DeleteRoomCommand
            {
                Id = id,
                RowVersion = rowVersion
            });

            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        private IActionResult ToActionResult(Result result)
        {
            if (result.Error == Errors.RoomNotFound || result.Error == Errors.RoomTypeNotFound)
            {
                return NotFound(new { Error = result.Error.Description });
            }

            if (result.Error == Errors.RoomExists ||
                result.Error == Errors.RoomHasBookings ||
                result.Error == Errors.ConcurrencyConflict)
            {
                return Conflict(new { Error = result.Error.Description });
            }

            return BadRequest(new { Error = result.Error.Description });
        }
    }
}

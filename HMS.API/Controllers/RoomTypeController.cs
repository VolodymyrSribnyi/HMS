using Application.RoomTypes.Commands;
using Application.RoomTypes.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RoomTypes.Commands;

namespace HMS.API.Controllers
{
    [Route("api/[controller]/[action]")]
    [Authorize]
    [ApiController]
    public class RoomTypeController : ControllerBase
    {
        private readonly IMediator _mediator;
        public RoomTypeController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        public async Task<IActionResult> Create(CreateRoomTypeCommand command)
        {
            var roomTypeId = await _mediator.Send(command);
            return CreatedAtAction(nameof(Create),new { Id = roomTypeId },command);
        }
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetRoomTypeByIdQuery query)
        {
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : NotFound();
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var query = new GetAllRoomTypesQuery();
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest();
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(Guid id)
        {
            var command = new DeleteRoomTypeCommand { Id = id };
            var isDeleted = await _mediator.Send(command);

            if(!isDeleted)
                return NotFound();

            return NoContent();
        }
    }
}

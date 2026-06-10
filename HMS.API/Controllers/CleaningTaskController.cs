using Application.CleaningTasks.Commands;
using Application.ErrorHandling;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/cleaning-tasks")]
    [ApiController]
    [Authorize]
    public class CleaningTaskController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CleaningTaskController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("{id:guid}/complete")]
        [Authorize(Roles = "Maid,Admin")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var result = await _mediator.Send(new CompleteCleaningTaskCommand
            {
                CleaningTaskId = id
            });

            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        private IActionResult ToActionResult(Result result)
        {
            if (result.Error == Errors.CleaningTaskNotFound ||
                result.Error == Errors.RoomNotFound)
            {
                return NotFound(new { Error = result.Error.Description });
            }

            if (result.Error == Errors.InvalidCleaningTaskStatus ||
                result.Error == Errors.InvalidRoomStatus ||
                result.Error == Errors.ConcurrencyConflict)
            {
                return Conflict(new { Error = result.Error.Description });
            }

            return BadRequest(new { Error = result.Error.Description });
        }
    }
}

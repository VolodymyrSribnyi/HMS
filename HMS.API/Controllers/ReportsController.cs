using Application.ErrorHandling;
using Application.Reports.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Accountant")]
    public class ReportsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ReportsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("financial")]
        public async Task<IActionResult> GetFinancialReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var query = new GetFinancialReportQuery(startDate, endDate);
            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        [HttpGet("operational")]
        public async Task<IActionResult> GetOperationalReport([FromQuery] DateTime? date)
        {
            var query = new GetOperationalReportQuery(date);
            var result = await _mediator.Send(query);

            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        private IActionResult ToActionResult(Result result)
        {
            return BadRequest(new { Error = result.Error.Description });
        }
    }
}

using Application.Billing.Commands;
using Application.ErrorHandling;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Receptionist,Admin")]
    public class InvoiceController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InvoiceController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("{invoiceId:guid}/payments")]
        public async Task<IActionResult> RegisterPayment(Guid invoiceId, [FromBody] RegisterPaymentCommand command)
        {
            command.InvoiceId = invoiceId;
            var result = await _mediator.Send(command);

            return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
        }

        private IActionResult ToActionResult(Result result)
        {
            if (result.Error == Errors.InvoiceNotFound)
            {
                return NotFound(new { Error = result.Error.Description });
            }

            if (result.Error == Errors.InvoiceAlreadyClosed ||
                result.Error == Errors.PaymentExceedsInvoiceBalance ||
                result.Error == Errors.ConcurrencyConflict)
            {
                return Conflict(new { Error = result.Error.Description });
            }

            return BadRequest(new { Error = result.Error.Description });
        }
    }
}

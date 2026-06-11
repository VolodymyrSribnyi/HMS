using System.Security.Claims;
using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Common.Behaviors
{
    public class AuditBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly IHmsDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditBehavior(IHmsDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            if (request is not IAuditableCommand<TResponse>)
            {
                return await next();
            }

            var response = await next();
            var httpContext = _httpContextAccessor.HttpContext;
            var userIdValue =
                httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                httpContext?.User.FindFirstValue("UserId");

            Guid? userId = Guid.TryParse(userIdValue, out var parsedUserId)
                ? parsedUserId
                : null;

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                TimeStamp = DateTime.UtcNow,
                ActionType = typeof(TRequest).Name,
                EntityName = typeof(TRequest).Name,
                EntityId = string.Empty,
                OldValue = string.Empty,
                NewValue = JsonSerializer.Serialize(request, request.GetType(), JsonOptions),
                IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
                UserId = userId
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);

            return response;
        }
    }
}

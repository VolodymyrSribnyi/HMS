using MediatR;

namespace Application.Common.Interfaces
{
    public interface IAuditableCommand<TResponse> : IRequest<TResponse>
    {
    }
}

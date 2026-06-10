using Domain.Common;
using MediatR;

namespace Application.Common.Events
{
    public sealed record DomainEventNotification<TDomainEvent>(TDomainEvent DomainEvent) : INotification
        where TDomainEvent : IDomainEvent;
}

using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.Commands
{
    public record DeleteRoomTypeCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}

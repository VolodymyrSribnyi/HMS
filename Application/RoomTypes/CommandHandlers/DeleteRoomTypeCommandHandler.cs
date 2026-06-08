using Application.Common.Interfaces;
using Application.RoomTypes.Commands;
using Domain.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.CommandHandlers
{
    public class DeleteRoomTypeCommandHandler : IRequestHandler<DeleteRoomTypeCommand, bool>
    {
        private readonly IHmsDbContext _context;
        public DeleteRoomTypeCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }
        public async Task<bool> Handle(DeleteRoomTypeCommand request, CancellationToken cancellationToken)
        {
            var roomType = await _context.RoomTypes.FindAsync(new object[] { request.Id }, cancellationToken);

            if (roomType == null)
                return false;

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}

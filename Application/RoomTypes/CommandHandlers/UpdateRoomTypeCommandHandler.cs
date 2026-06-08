using Application.Common.Interfaces;
using Application.RoomTypes.Commands;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.RoomTypes.CommandHandlers
{
    public class UpdateRoomTypeCommandHandler : IRequestHandler<UpdateRoomTypeCommand, bool>
    {
        private readonly IHmsDbContext _context;
        public UpdateRoomTypeCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateRoomTypeCommand request, CancellationToken cancellationToken)
        {
            var roomType = await _context.RoomTypes.FindAsync(new object[] { request.Id }, cancellationToken);

            if (roomType == null)
                return false;

            roomType.Update(
                request.Name, request.Capacity, request.BasePrice,
                request.Description, request.Amenities);

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}

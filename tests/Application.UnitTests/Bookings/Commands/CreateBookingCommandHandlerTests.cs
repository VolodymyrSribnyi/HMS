using Application.Bookings.CommandHandlers;
using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities;
using Domain.Entities.Enums;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using MockQueryable.NSubstitute;
using NSubstitute;
using Xunit;

namespace Application.UnitTests.Bookings.Commands;

public class CreateBookingCommandHandlerTests
{
    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessResult()
    {
        var roomType = RoomType.Create("Standard", 2, 100m, "Standard room", "Wi-Fi");
        var room = Room.Create("101", 1, RoomStatus.Available, roomType.Id);
        room.RoomType = roomType;

        var command = new CreateBookingCommand
        {
            RoomId = room.Id,
            GuestId = Guid.NewGuid(),
            CheckInDate = DateTime.UtcNow.Date.AddDays(1),
            CheckOutDate = DateTime.UtcNow.Date.AddDays(3)
        };

        var context = CreateContext(
            bookings: [],
            rooms: [room],
            users: [new UserProfile { Id = command.GuestId, FirstName = "John", LastName = "Doe" }]);

        var handler = CreateHandler(context);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);
        await context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_RoomAlreadyBooked_ReturnsFailureResult()
    {
        var roomId = Guid.NewGuid();
        var guestId = Guid.NewGuid();
        var roomTypeId = Guid.NewGuid();
        var checkInDate = DateTime.UtcNow.Date.AddDays(3);
        var checkOutDate = DateTime.UtcNow.Date.AddDays(5);

        var existingBooking = Booking.Create(
            checkInDate.AddDays(-1),
            checkOutDate.AddDays(-1),
            totalPrice: 200m,
            guestId: Guid.NewGuid(),
            roomTypeId);
        existingBooking.AssignRoom(roomId);

        var context = CreateContext(
            bookings: [existingBooking],
            rooms: [],
            users: []);

        var handler = CreateHandler(context);
        var command = new CreateBookingCommand
        {
            RoomId = roomId,
            GuestId = guestId,
            CheckInDate = checkInDate,
            CheckOutDate = checkOutDate
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(Errors.RoomIsBooked, result.Error);
        await context.Received(0).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CheckInDateInPast_ReturnsFailureResult()
    {
        var context = CreateContext(
            bookings: [],
            rooms: [],
            users: []);

        var handler = CreateHandler(context);
        var command = new CreateBookingCommand
        {
            RoomId = Guid.NewGuid(),
            GuestId = Guid.NewGuid(),
            CheckInDate = DateTime.UtcNow.Date.AddDays(-1),
            CheckOutDate = DateTime.UtcNow.Date.AddDays(1)
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(Errors.BookingDateInPast, result.Error);
        await context.Received(0).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private static CreateBookingCommandHandler CreateHandler(IHmsDbContext context)
    {
        return new CreateBookingCommandHandler(new BookingRepository(context), context);
    }

    private static IHmsDbContext CreateContext(
        IReadOnlyCollection<Booking> bookings,
        IReadOnlyCollection<Room> rooms,
        IReadOnlyCollection<UserProfile> users)
    {
        var context = Substitute.For<IHmsDbContext>();

        var bookingSet = bookings.ToList().BuildMockDbSet();
        var roomSet = rooms.ToList().BuildMockDbSet();
        var userSet = users.ToList().BuildMockDbSet();

        bookingSet
            .AddAsync(Arg.Any<Booking>(), Arg.Any<CancellationToken>())
            .Returns(new ValueTask<EntityEntry<Booking>>((EntityEntry<Booking>)null!));

        context.Bookings.Returns(bookingSet);
        context.Rooms.Returns(roomSet);
        context.UserProfiles.Returns(userSet);
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        return context;
    }
}

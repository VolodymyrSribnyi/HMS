using Application.Bookings.CommandHandlers;
using Application.Bookings.Commands;
using Application.Common.Events;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.Housekeeping.EventHandlers;
using Domain.Entities;
using Domain.Entities.Enums;
using Domain.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using MockQueryable.NSubstitute;
using NSubstitute;
using Xunit;

namespace Application.UnitTests.Bookings.Commands;

public class BookingLifecycleCommandHandlerTests
{
    [Fact]
    public async Task Handle_BookingIsConfirmed_ChangesStatusToCheckedIn()
    {
        var roomType = RoomType.Create("Standard", 2, 100m, "Wi-Fi", "Wi-Fi");
        var room = Room.Create("101", 1, RoomStatus.Available, roomType.Id);
        var booking = CreateBooking(roomType.Id, BookingStatus.Confirmed);
        booking.AssignRoom(room.Id);

        var context = CreateContext(
            bookings: [booking],
            rooms: [room]);

        var handler = new CheckInBookingCommandHandler(context);
        var command = new CheckInBookingCommand
        {
            BookingId = booking.Id,
            RoomId = room.Id
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(BookingStatus.CheckedIn, booking.Status);
        Assert.Equal(RoomStatus.Occupied, room.Status);
        await context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_BookingNotConfirmed_ReturnsFailure()
    {
        var roomType = RoomType.Create("Standard", 2, 100m, "Wi-Fi", "Wi-Fi");
        var room = Room.Create("101", 1, RoomStatus.Available, roomType.Id);
        var booking = CreateBooking(roomType.Id, BookingStatus.Cancelled);
        booking.AssignRoom(room.Id);

        var context = CreateContext(
            bookings: [booking],
            rooms: [room]);

        var handler = new CheckInBookingCommandHandler(context);
        var command = new CheckInBookingCommand
        {
            BookingId = booking.Id,
            RoomId = room.Id
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(Errors.InvalidBookingStatus, result.Error);
        await context.Received(0).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidCheckOut_ChangesStatusesAndCreatesCleaningTask()
    {
        var roomType = RoomType.Create("Standard", 2, 100m, "Wi-Fi", "Wi-Fi");
        var room = Room.Create("101", 1, RoomStatus.Occupied, roomType.Id);
        room.RoomType = roomType;

        var booking = CreateBooking(roomType.Id, BookingStatus.CheckedIn);
        booking.AssignRoom(room.Id);
        booking.AssignedRoom = room;
        booking.RoomType = roomType;

        var context = CreateContext(
            bookings: [booking],
            rooms: [room]);

        var handler = new CheckOutBookingCommandHandler(context);
        var command = new CheckOutBookingCommand
        {
            BookingId = booking.Id,
            Discount = 0m
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(BookingStatus.CheckedOut, booking.Status);
        await context.Invoices.Received(1).AddAsync(Arg.Any<Invoice>(), Arg.Any<CancellationToken>());
        await context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

        var domainEvent = Assert.Single(booking.DomainEvents.OfType<BookingCheckedOutEvent>());
        Assert.Equal(booking.Id, domainEvent.BookingId);
        Assert.Equal(room.Id, domainEvent.RoomId);

        var housekeepingHandler = new HousekeepingEventHandler(context);
        await housekeepingHandler.Handle(
            new DomainEventNotification<BookingCheckedOutEvent>(domainEvent),
            CancellationToken.None);

        Assert.Equal(RoomStatus.NeedsCleaning, room.Status);
        await context.CleaningTasks.Received(1).AddAsync(
            Arg.Is<CleaningTask>(task => task.RoomId == room.Id && task.Status == CleaningTaskStatus.Pending),
            Arg.Any<CancellationToken>());
    }

    private static Booking CreateBooking(Guid roomTypeId, BookingStatus status)
    {
        var booking = Booking.Create(
            DateTime.UtcNow.Date.AddDays(-1),
            DateTime.UtcNow.Date.AddDays(1),
            totalPrice: 200m,
            guestId: Guid.NewGuid(),
            roomTypeId);

        booking.Status = status;

        return booking;
    }

    private static IHmsDbContext CreateContext(
        IReadOnlyCollection<Booking> bookings,
        IReadOnlyCollection<Room> rooms)
    {
        var context = Substitute.For<IHmsDbContext>();

        var bookingSet = bookings.ToList().BuildMockDbSet();
        var roomSet = rooms.ToList().BuildMockDbSet();
        var invoiceSet = new List<Invoice>().BuildMockDbSet();
        var cleaningTaskSet = new List<CleaningTask>().BuildMockDbSet();

        invoiceSet
            .AddAsync(Arg.Any<Invoice>(), Arg.Any<CancellationToken>())
            .Returns(new ValueTask<EntityEntry<Invoice>>((EntityEntry<Invoice>)null!));

        cleaningTaskSet
            .AddAsync(Arg.Any<CleaningTask>(), Arg.Any<CancellationToken>())
            .Returns(new ValueTask<EntityEntry<CleaningTask>>((EntityEntry<CleaningTask>)null!));

        context.Bookings.Returns(bookingSet);
        context.Rooms.Returns(roomSet);
        context.Invoices.Returns(invoiceSet);
        context.CleaningTasks.Returns(cleaningTaskSet);
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        return context;
    }
}

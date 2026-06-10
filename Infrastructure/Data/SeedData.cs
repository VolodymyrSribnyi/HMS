using Domain.Entities;
using Domain.Entities.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    public static class SeedData
    {
        private const string DemoPassword = "Demo123!";

        public static async Task InitializeAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<HmsDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

            await context.Database.MigrateAsync();

            await SeedRolesAsync(roleManager);

            await SeedUserAsync(context, userManager, "admin@hms.local", "admin", "System", "Admin", "Admin");
            await SeedUserAsync(context, userManager, "receptionist@hms.local", "receptionist", "Front", "Desk", "Receptionist");
            var maid = await SeedUserAsync(context, userManager, "maid@hms.local", "maid", "Housekeeping", "Maid", "Maid");
            var guest = await SeedUserAsync(context, userManager, "guest@hms.local", "guest", "Demo", "Guest", "Guest");

            var standard = await SeedRoomTypeAsync(context, "Standard", 2, 1200m, "Comfortable room for short stays.", "Wi-Fi, TV, shower");
            var deluxe = await SeedRoomTypeAsync(context, "Deluxe", 3, 2200m, "Larger room with better view.", "Wi-Fi, TV, minibar, balcony");

            await SeedRoomAsync(context, "101", 1, RoomStatus.Available, standard.Id);
            await SeedRoomAsync(context, "102", 1, RoomStatus.Available, standard.Id);
            var room201 = await SeedRoomAsync(context, "201", 2, RoomStatus.NeedsCleaning, deluxe.Id);
            var room202 = await SeedRoomAsync(context, "202", 2, RoomStatus.Occupied, deluxe.Id);

            await SeedCheckedInBookingAsync(context, guest.Id, deluxe.Id, room202.Id, deluxe.BasePrice);
            await SeedPendingCleaningTaskAsync(context, room201.Id, maid.Id);

            await context.SaveChangesAsync();
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
        {
            var roles = new[] { "Admin", "Receptionist", "Maid", "Guest" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                }
            }
        }

        private static async Task<ApplicationUser> SeedUserAsync(
            HmsDbContext context,
            UserManager<ApplicationUser> userManager,
            string email,
            string userName,
            string firstName,
            string lastName,
            string role)
        {
            var user = await userManager.FindByEmailAsync(email);

            if (user is null)
            {
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    UserName = userName,
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(user, DemoPassword);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Failed to seed user '{email}': {errors}");
                }
            }

            if (!await userManager.IsInRoleAsync(user, role))
            {
                await userManager.AddToRoleAsync(user, role);
            }

            var profileExists = await context.UserProfiles.AnyAsync(profile => profile.Id == user.Id);
            if (!profileExists)
            {
                context.UserProfiles.Add(new UserProfile
                {
                    Id = user.Id,
                    FirstName = firstName,
                    LastName = lastName
                });
            }

            return user;
        }

        private static async Task<RoomType> SeedRoomTypeAsync(
            HmsDbContext context,
            string name,
            int capacity,
            decimal basePrice,
            string description,
            string amenities)
        {
            var roomType = await context.RoomTypes.FirstOrDefaultAsync(type => type.Name == name);

            if (roomType is not null)
            {
                return roomType;
            }

            roomType = RoomType.Create(name, capacity, basePrice, description, amenities);
            context.RoomTypes.Add(roomType);

            return roomType;
        }

        private static async Task<Room> SeedRoomAsync(
            HmsDbContext context,
            string roomNumber,
            int floor,
            RoomStatus status,
            Guid roomTypeId)
        {
            var room = await context.Rooms.FirstOrDefaultAsync(room => room.RoomNumber == roomNumber);

            if (room is not null)
            {
                return room;
            }

            room = Room.Create(roomNumber, floor, status, roomTypeId);
            context.Rooms.Add(room);

            return room;
        }

        private static async Task SeedCheckedInBookingAsync(
            HmsDbContext context,
            Guid guestId,
            Guid roomTypeId,
            Guid roomId,
            decimal nightlyRate)
        {
            var room = await context.Rooms.FirstAsync(room => room.Id == roomId);
            room.MarkOccupied();

            var exists = await context.Bookings.AnyAsync(booking =>
                booking.GuestId == guestId &&
                booking.AssignedRoomId == roomId &&
                booking.Status == BookingStatus.CheckedIn);

            if (exists)
            {
                return;
            }

            var checkIn = DateTime.UtcNow.Date.AddDays(-1);
            var checkOut = DateTime.UtcNow.Date.AddDays(1);
            var booking = Booking.Create(checkIn, checkOut, nightlyRate * 2, guestId, roomTypeId);
            booking.CheckIn(roomId);

            context.Bookings.Add(booking);
        }

        private static async Task SeedPendingCleaningTaskAsync(HmsDbContext context, Guid roomId, Guid maidId)
        {
            var room = await context.Rooms.FirstAsync(room => room.Id == roomId);
            room.MarkNeedsCleaning();

            var exists = await context.CleaningTasks.AnyAsync(task =>
                task.RoomId == roomId &&
                task.Status != CleaningTaskStatus.Completed);

            if (exists)
            {
                return;
            }

            var task = CleaningTask.CreatePending(roomId);
            task.AssignedMaidId = maidId;

            context.CleaningTasks.Add(task);
        }
    }
}

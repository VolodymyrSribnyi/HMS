using System;
using System.Collections.Generic;
using System.Text;

namespace Application.ErrorHandling
{
    public static class Errors
    {
        public static readonly Error NullData = new("NULL_DATA", "The provided data is null.");
        public static readonly Error InvalidData = new("INVALID_DATA", "The provided data is invalid.");
        
        public static readonly Error PictureTooLarge = new Error("PICTURE_TOO_LARGE", "Picture size exceed");
        public static readonly Error InvalidRating = new Error("INVALID_RATING", "Provided rating invalid,must be between 1-5");
        public static readonly Error PictureNotFound = new Error("PICTURE_NOT_FOUND", "Picture not found");
        public static readonly Error NotificationCreationFailed = new Error("NOTIFICATION_CREATION_FAILED", "Failed to create the notification request.");
        public static readonly Error NotificationNotFound = new Error("NOTIFICATION_NOT_FOUND", "The specified notification request was not found.");
        public static readonly Error FailedToMarkAsRead = new Error("FAILED_TO_MARK_AS_READ", "Failed to mark the notification as read.");
        public static readonly Error BookingNotFound = new Error("BOOKING_NOT_FOUND", "The specified booking was not found.");
        public static readonly Error BookingCreationFailed = new Error("BOOKING_CREATION_FAILED", "Failed to create the booking.");
        public static readonly Error BookingExists = new Error("BOOKING_EXISTS", "The reservation already exists.");
        public static readonly Error UserNotFound = new Error("USER_NOT_FOUND", "The specified user was not found.");
        public static readonly Error UserExists = new Error("USER_EXISTS", "The user already exists.");
        public static readonly Error UsersNotFoundForRole = new Error("USERS_NOT_FOUND_FOR_ROLE", "No users found for the specified role.");
        public static readonly Error InvalidLoginAttempt = new Error("INVALID_LOGIN_ATTEMPT", "Invalid username or password.");
        public static readonly Error UserHasActiveBookings = new Error("USER_HAS_ACTIVE_RESERVATIONS", "The user has active reservations and cannot be deleted.");
        public static readonly Error NotificationDeletionFailed = new Error("NOTIFICATION_DELETION_FAILED", "Failed to delete the notification request.");
        public static readonly Error RoomTypeNotFound = new Error("ROOM_TYPE_NOT_FOUND", "The specified room type was not found.");
        public static readonly Error RoomTypeExists = new Error("ROOM_TYPE_EXISTS", "The specified room type already exists.");
        public static readonly Error RoomNotFound = new Error("ROOM_NOT_FOUND", "The specified room  was not found.");
        public static readonly Error BookingDateInPast = new Error("BOOKING_DATE_IN_PAST", "It is not possible to book a room for a date in the past.");
        public static readonly Error BookingCheckInDateLaterThanCheckOut = new Error("CHECKIN_DATE_LATER_THAN_CHECKOUT", "The CheckOut date must be later than the CheckIn date.");
        public static readonly Error BookingRaceCondition = new Error("BOOKING_RACE_CONDITION", "Unfortunately, someone else has just booked this room for your dates. Please try again");
        public static readonly Error RoomIsBooked = new Error("ROOM_BOOKED_ON_THESE_DATES", "Unfortunately, this room is already booked for the dates you’ve chosen");
        public static readonly Error UnauthorizedBookingAccess = new Error("", "");
        public static readonly Error InvalidToken = new Error("AUTH_INVALID_TOKEN", "Invalid Refresh Token.");
        public static readonly Error TokenExpired = new Error("AUTH_EXPIRED_TOKEN", "Expired Refresh Token.");
        public static readonly Error AuthFailed = new Error("AUTH_FAILED", "Failed to authenticate.");
        public static readonly Error AuthInvalidCredentials = new Error("AUTH_INVALID_CREDENTIALS", "Failed to authenticate.Invalid Credentials");
    }
}

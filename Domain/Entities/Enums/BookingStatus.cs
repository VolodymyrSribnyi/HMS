using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Enums
{
    public enum BookingStatus
    {
        Pending,
        Confirmed,
        CheckedIn,
        CheckedOut,
        Cancelled
    }
}

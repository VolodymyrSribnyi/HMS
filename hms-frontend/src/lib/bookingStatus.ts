export type BookingStatusName = 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';

const statusByNumber: Record<number, BookingStatusName> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'CheckedIn',
  3: 'CheckedOut',
  4: 'Cancelled',
};

export const normalizeBookingStatus = (status: string | number): BookingStatusName => {
  if (typeof status === 'number') {
    return statusByNumber[status] ?? 'Pending';
  }

  return status as BookingStatusName;
};

export const isExpectedArrivalStatus = (status: string | number) => {
  const normalizedStatus = normalizeBookingStatus(status);
  return normalizedStatus === 'Pending' || normalizedStatus === 'Confirmed';
};

export const isExpectedDepartureStatus = (status: string | number) =>
  normalizeBookingStatus(status) === 'CheckedIn';

export const canModifyBookingStatus = (status: string | number) => isExpectedArrivalStatus(status);

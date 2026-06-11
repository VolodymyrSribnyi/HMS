import { useEffect, useMemo, useState } from 'react';
import type { BookingDto } from '../../types/booking';
import { checkInBooking, checkOutBooking, getReceptionBookings } from './receptionApi';
import { isExpectedArrivalStatus, isExpectedDepartureStatus, normalizeBookingStatus } from '../../lib/bookingStatus';

const panelShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const cardShadow = 'shadow-[6px_6px_12px_rgba(163,177,198,0.35),-6px_-6px_12px_rgba(255,255,255,0.85)]';
const buttonShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA');

interface BookingRowProps {
  booking: BookingDto;
  actionLabel: string;
  isBusy: boolean;
  isDisabled?: boolean;
  onAction: (booking: BookingDto) => void;
}

const BookingRow = ({ booking, actionLabel, isBusy, isDisabled, onAction }: BookingRowProps) => (
  <div className={`rounded-3xl bg-[#edf1f7] p-4 ${cardShadow}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold text-[#2d3748]">{booking.roomTypeName}</h3>
          <span className="rounded-full bg-[#e8ecf2] px-3 py-1 text-xs font-semibold text-[#4f7cff] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.35),inset_-4px_-4px_8px_rgba(255,255,255,0.85)]">
            {normalizeBookingStatus(booking.status)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#718096] sm:grid-cols-3">
          <span>Заїзд: <strong className="text-[#2d3748]">{formatDate(booking.checkInDate)}</strong></span>
          <span>Виїзд: <strong className="text-[#2d3748]">{formatDate(booking.checkOutDate)}</strong></span>
          <span>Сума: <strong className="text-[#2d3748]">{booking.totalPrice.toFixed(2)}</strong></span>
        </div>
      </div>

      <button
        type="button"
        disabled={isBusy || isDisabled}
        onClick={() => onAction(booking)}
        className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-[#9bb4ff] ${buttonShadow}`}
      >
        {isBusy ? 'Обробка...' : actionLabel}
      </button>
    </div>
  </div>
);

export const ReceptionDashboardPage = () => {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyBookingIds, setBusyBookingIds] = useState<string[]>([]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const data = await getReceptionBookings();
        setBookings(data);
      } catch (requestError: unknown) {
        setError(getApiError(requestError) ?? 'Не вдалося завантажити бронювання для рецепції.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const expectedArrivals = useMemo(
    () => bookings.filter((booking) => isExpectedArrivalStatus(booking.status)),
    [bookings],
  );

  const expectedDepartures = useMemo(
    () => bookings.filter((booking) => isExpectedDepartureStatus(booking.status)),
    [bookings],
  );

  const setBookingBusy = (bookingId: string, isBusy: boolean) => {
    setBusyBookingIds((current) =>
      isBusy ? [...current, bookingId] : current.filter((id) => id !== bookingId),
    );
  };

  const handleCheckIn = async (booking: BookingDto) => {
    if (!booking.assignedRoomId) {
      setError('Для цього бронювання не призначено номер.');
      return;
    }

    try {
      setError(null);
      setBookingBusy(booking.id, true);
      await checkInBooking(booking.id, booking.assignedRoomId);
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status: 'CheckedIn' } : item)),
      );
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося заселити гостя.');
    } finally {
      setBookingBusy(booking.id, false);
    }
  };

  const handleCheckOut = async (booking: BookingDto) => {
    try {
      setError(null);
      setBookingBusy(booking.id, true);
      await checkOutBooking(booking.id);
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status: 'CheckedOut' } : item)),
      );
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося виселити гостя.');
    } finally {
      setBookingBusy(booking.id, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8dfeb] border-t-[#4f7cff]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#2d3748]">
      <div>
        <h1 className="text-3xl font-bold">Дашборд рецепції</h1>
        <p className="mt-2 text-[#718096]">Керуйте заселеннями та виселеннями гостей.</p>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 p-4 text-[#e45858] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Очікувані заїзди</h2>
            <span className="rounded-full bg-[#e8ecf2] px-4 py-2 text-sm font-semibold text-[#4f7cff] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.35),inset_-4px_-4px_8px_rgba(255,255,255,0.85)]">
              {expectedArrivals.length}
            </span>
          </div>

          <div className="space-y-4">
            {expectedArrivals.length === 0 ? (
              <div className="rounded-3xl bg-[#edf1f7] p-8 text-center text-[#718096] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
                Немає очікуваних заїздів.
              </div>
            ) : (
              expectedArrivals.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  actionLabel="Заселити"
                  isBusy={busyBookingIds.includes(booking.id)}
                  isDisabled={!booking.assignedRoomId}
                  onAction={handleCheckIn}
                />
              ))
            )}
          </div>
        </section>

        <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Очікувані виїзди</h2>
            <span className="rounded-full bg-[#e8ecf2] px-4 py-2 text-sm font-semibold text-[#4f7cff] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.35),inset_-4px_-4px_8px_rgba(255,255,255,0.85)]">
              {expectedDepartures.length}
            </span>
          </div>

          <div className="space-y-4">
            {expectedDepartures.length === 0 ? (
              <div className="rounded-3xl bg-[#edf1f7] p-8 text-center text-[#718096] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
                Немає очікуваних виїздів.
              </div>
            ) : (
              expectedDepartures.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  actionLabel="Виселити"
                  isBusy={busyBookingIds.includes(booking.id)}
                  onAction={handleCheckOut}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeBookingStatus, type BookingStatusName } from '../../lib/bookingStatus';
import { type BookingDto } from '../../types/booking';
import { useAuthStore } from '../auth/stores/authStore';
import { getAllBookings, getMyBookings } from './bookingApi';

const panelShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const cardShadow = 'shadow-[6px_6px_12px_rgba(163,177,198,0.35),-6px_-6px_12px_rgba(255,255,255,0.85)]';
const insetShadow = 'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]';
const activeInsetShadow = 'active:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]';
const inputClass = `rounded-2xl bg-[#edf1f7] px-4 py-3 text-sm text-[#2d3748] outline-none transition-all duration-200 placeholder:text-[#9aa7ba] focus:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.3),inset_-5px_-5px_10px_rgba(255,255,255,0.9),0_0_0_3px_rgba(79,124,255,0.18)] ${insetShadow}`;
const softButtonClass = `rounded-2xl bg-[#edf1f7] px-4 py-3 text-sm font-semibold text-[#4f7cff] transition-all duration-200 hover:scale-[1.02] ${cardShadow} ${activeInsetShadow}`;

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA');
const formatMoney = (value: number) => `${value.toFixed(2)} грн`;
const getDateOnly = (value: string) => value.slice(0, 10);
const dateToTime = (value: string) => new Date(`${value}T00:00:00`).getTime();
const todayTime = dateToTime(new Date().toISOString().slice(0, 10));
const getGuestDisplayName = (booking: BookingDto) => {
  const guestName = booking.guestFullName?.trim();
  if (guestName) return guestName;
  if (booking.guestId) return `Гість ${booking.guestId.slice(0, 8)}`;
  return 'Профіль гостя не знайдено';
};

const getRoomDisplayName = (booking: BookingDto, canManageBookings: boolean) => {
  const roomNumber = booking.assignedRoomNumber?.trim();

  if (canManageBookings) {
    return roomNumber ? `Номер ${roomNumber}` : 'Не призначено';
  }

  const status = normalizeBookingStatus(booking.status);

  if (status === 'Pending' || status === 'Confirmed') {
    return 'Визначиться при заселенні';
  }

  if (status === 'CheckedIn') {
    return roomNumber ? `Номер ${roomNumber}` : 'Не призначено';
  }

  return roomNumber ? `Номер ${roomNumber}` : 'Не призначено';
};

interface BookingStatusBadgeProps {
  status: string | number;
}

const statusStyles: Record<BookingStatusName, string> = {
  Pending: 'bg-[#e8ecf2] text-[#718096]',
  Confirmed: 'bg-[#e4eefc] text-[#4f7cff]',
  CheckedIn: 'bg-[#e0f4ec] text-[#2fb67d]',
  CheckedOut: 'bg-[#e5e9ef] text-[#718096]',
  Cancelled: 'bg-[#f7e4e4] text-[#e45858]',
};

const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const normalizedStatus = normalizeBookingStatus(status);

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[normalizedStatus]} ${insetShadow}`}>
      {normalizedStatus}
    </span>
  );
};

const hasRole = (roles: string[], role: string) =>
  roles.some((userRole) => userRole.toLowerCase() === role.toLowerCase());

type BookingViewFilter = 'all' | 'active' | 'past';

const bookingViewFilters: Array<{ value: BookingViewFilter; label: string }> = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Актуальні' },
  { value: 'past', label: 'Минулі' },
];

const isPastBooking = (booking: BookingDto) => {
  const status = normalizeBookingStatus(booking.status);
  const checkOutTime = dateToTime(getDateOnly(booking.checkOutDate));

  return status === 'CheckedOut' || status === 'Cancelled' || checkOutTime < todayTime;
};

export const BookingsPage = () => {
  const navigate = useNavigate();
  const roles = useAuthStore((state) => state.roles);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [viewFilter, setViewFilter] = useState<BookingViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageBookings = useMemo(
    () => hasRole(roles, 'Receptionist') || hasRole(roles, 'Admin'),
    [roles],
  );

  const pageTitle = canManageBookings ? 'Управління бронюваннями' : 'Мої бронювання';
  const hasActiveFilters = viewFilter !== 'all' || searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== '';

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filterStart = dateFrom ? dateToTime(dateFrom) : null;
    const filterEnd = dateTo ? dateToTime(dateTo) : null;

    return bookings.filter((booking) => {
      const isPast = isPastBooking(booking);

      if (viewFilter === 'past' && !isPast) {
        return false;
      }

      if (viewFilter === 'active' && isPast) {
        return false;
      }

      if (!canManageBookings) {
        return true;
      }

      const roomNumber = booking.assignedRoomNumber ?? '';
      const roomType = booking.roomTypeName ?? '';
      const guestName = getGuestDisplayName(booking);
      const matchesText =
        query === '' ||
        roomNumber.toLowerCase().includes(query) ||
        roomType.toLowerCase().includes(query) ||
        guestName.toLowerCase().includes(query);

      const bookingStart = dateToTime(getDateOnly(booking.checkInDate));
      const bookingEnd = dateToTime(getDateOnly(booking.checkOutDate));
      const matchesDateFrom = filterStart === null || bookingEnd >= filterStart;
      const matchesDateTo = filterEnd === null || bookingStart <= filterEnd;

      return matchesText && matchesDateFrom && matchesDateTo;
    });
  }, [bookings, canManageBookings, dateFrom, dateTo, searchQuery, viewFilter]);

  const clearFilters = () => {
    setViewFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const loadBookings = async (showLoading = true) => {
    try {
      setError(null);
      if (showLoading) {
        setIsLoading(true);
      }
      const data = canManageBookings ? await getAllBookings() : await getMyBookings();
      setBookings(data);
      return data;
    } catch {
      setError('Не вдалося завантажити бронювання. Спробуйте пізніше.');
      return [];
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [canManageBookings]);

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
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="mt-2 text-[#718096]">
          {canManageBookings
            ? 'Переглядайте бронювання гостей та відкривайте повну інформацію.'
            : 'Переглядайте свої бронювання та деталі проживання.'}
        </p>
      </div>

      {error && (
        <div className={`rounded-3xl bg-[#f7e4e4] p-4 font-medium text-[#e45858] ${insetShadow}`}>
          {error}
        </div>
      )}

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Фільтр історії</h2>
            <p className="mt-1 text-sm text-[#718096]">
              {canManageBookings
                ? 'Перемикайте всі бронювання, актуальні записи або минулу історію гостей.'
                : 'Перемикайте свої актуальні бронювання або історію попередніх проживань.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className={softButtonClass}>
              Очистити
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {bookingViewFilters.map((filter) => {
            const isSelected = viewFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setViewFilter(filter.value)}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? `bg-[#edf1f7] text-[#4f7cff] ${insetShadow}`
                    : `bg-[#edf1f7] text-[#718096] hover:scale-[1.02] ${cardShadow} ${activeInsetShadow}`
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {canManageBookings && (
        <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Пошук і фільтри</h2>
              <p className="mt-1 text-sm text-[#718096]">
                Шукайте за номером, типом кімнати або іменем гостя. Період показує бронювання, які перетинаються з вибраними датами.
              </p>
            </div>
            {(searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== '') && (
              <button type="button" onClick={clearFilters} className={softButtonClass}>
                Очистити
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#718096]">Номер, тип кімнати або гість</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Наприклад: 204, Deluxe, Іван"
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#718096]">Дата з</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#718096]">Дата по</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </section>
      )}

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Бронювання</h2>
          <span className={`rounded-full bg-[#e8ecf2] px-4 py-2 text-sm font-semibold text-[#4f7cff] ${insetShadow}`}>
            {hasActiveFilters ? `${filteredBookings.length} / ${bookings.length}` : bookings.length}
          </span>
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className={`rounded-3xl bg-[#edf1f7] p-8 text-center text-[#718096] ${insetShadow}`}>
              {canManageBookings && hasActiveFilters
                ? 'За вибраними фільтрами бронювань не знайдено.'
                : hasActiveFilters
                  ? 'За вибраним фільтром бронювань не знайдено.'
                  : 'У вас немає бронювань.'}
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className={`block w-full rounded-3xl bg-[#edf1f7] p-4 text-left transition-all duration-200 hover:scale-[1.01] ${activeInsetShadow} ${cardShadow}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#2d3748]">
                        {getRoomDisplayName(booking, canManageBookings)}
                      </h3>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#718096] sm:grid-cols-4">
                      <span>Тип: <strong className="text-[#2d3748]">{booking.roomTypeName}</strong></span>
                      <span>Гість: <strong className="text-[#2d3748]">{getGuestDisplayName(booking)}</strong></span>
                      <span>Заїзд: <strong className="text-[#2d3748]">{formatDate(booking.checkInDate)}</strong></span>
                      <span>Виїзд: <strong className="text-[#2d3748]">{formatDate(booking.checkOutDate)}</strong></span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#edf1f7] px-4 py-3 text-right font-bold text-[#2d3748] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.35),inset_-4px_-4px_8px_rgba(255,255,255,0.85)]">
                    {formatMoney(booking.totalPrice)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

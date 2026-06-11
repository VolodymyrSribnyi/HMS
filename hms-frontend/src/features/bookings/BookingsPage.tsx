import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { canModifyBookingStatus, normalizeBookingStatus } from '../../lib/bookingStatus';
import { type BookingDto } from '../../types/booking';
import { cancelBooking, getMyBookings, updateBookingDates } from './bookingApi';

const pageShadow = 'shadow-[10px_10px_22px_rgba(163,177,198,0.35),-10px_-10px_22px_rgba(255,255,255,0.9)]';
const floatingShadow = 'shadow-[8px_8px_18px_rgba(163,177,198,0.32),-8px_-8px_18px_rgba(255,255,255,0.88)]';
const insetShadow = 'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]';
const activeInsetShadow = 'active:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]';

const dateSchema = z.object({
  checkInDate: z.string().min(1, 'Вкажіть дату заїзду'),
  checkOutDate: z.string().min(1, 'Вкажіть дату виїзду'),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
  message: 'Дата виїзду повинна бути пізніше дати заїзду',
  path: ['checkOutDate'],
});

type DateFormValues = z.infer<typeof dateSchema>;

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA');
const toDateInputValue = (value: string) => new Date(value).toISOString().slice(0, 10);
const canModify = (booking: BookingDto) => canModifyBookingStatus(booking.status);

const getStatusStyle = (status: string | number) => {
  const normalizedStatus = normalizeBookingStatus(status);
  if (normalizedStatus === 'Cancelled') return 'bg-[#f7e4e4] text-[#e45858]';
  if (normalizedStatus === 'CheckedIn') return 'bg-[#e4eefc] text-[#4f7cff]';
  if (normalizedStatus === 'CheckedOut') return 'bg-[#e5e9ef] text-[#718096]';
  return 'bg-[#e0f4ec] text-[#2fb67d]';
};

export const BookingsPage = () => {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<BookingDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<'update' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DateFormValues>({
    resolver: zodResolver(dateSchema),
  });

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyBookings();
      setBookings(data);
    } catch {
      setError('Не вдалося завантажити ваші бронювання. Спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const openBooking = (booking: BookingDto) => {
    setSelectedBooking(booking);
    setMessage(null);
    setError(null);
    reset({
      checkInDate: toDateInputValue(booking.checkInDate),
      checkOutDate: toDateInputValue(booking.checkOutDate),
    });
  };

  const refreshSelectedBooking = (bookingId: string, refreshedBookings: BookingDto[]) => {
    const refreshed = refreshedBookings.find((booking) => booking.id === bookingId) ?? null;
    setSelectedBooking(refreshed);

    if (refreshed) {
      reset({
        checkInDate: toDateInputValue(refreshed.checkInDate),
        checkOutDate: toDateInputValue(refreshed.checkOutDate),
      });
    }
  };

  const handleUpdateDates = async (values: DateFormValues) => {
    if (!selectedBooking) return;

    const roomId = selectedBooking.assignedRoomId ?? selectedBooking.roomId;
    if (!roomId) {
      setError('Для цього бронювання не знайдено номер, тому дату змінити неможливо.');
      return;
    }

    try {
      setBusyAction('update');
      setError(null);
      setMessage(null);
      await updateBookingDates(selectedBooking.id, {
        roomId,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
      });

      const refreshedBookings = await getMyBookings();
      setBookings(refreshedBookings);
      refreshSelectedBooking(selectedBooking.id, refreshedBookings);
      setMessage('Дати бронювання оновлено.');
    } catch {
      setError('Не вдалося змінити дати. Перевірте доступність номера на вибраний період.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      setBusyAction('cancel');
      setError(null);
      setMessage(null);
      await cancelBooking(bookingToCancel.id);

      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingToCancel.id ? { ...booking, status: 'Cancelled' } : booking,
        ),
      );
      setSelectedBooking(null);
      setBookingToCancel(null);
      setMessage('Бронювання скасовано.');
    } catch {
      setError('Не вдалося скасувати бронювання. Можливо, його статус уже не дозволяє цю дію.');
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className={`rounded-3xl bg-[#edf1f7] px-8 py-5 text-xl font-semibold text-[#718096] ${pageShadow}`}>
          Завантаження...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#e8ecf2] text-[#2d3748]">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Мої бронювання</h1>
        <p className="text-[#718096]">Переглядайте деталі, змінюйте дати або скасовуйте майбутні бронювання.</p>
      </div>

      {error && (
        <div className={`mb-6 rounded-3xl bg-[#f7e4e4] p-5 font-medium text-[#e45858] ${floatingShadow}`}>
          {error}
        </div>
      )}

      {message && (
        <div className={`mb-6 rounded-3xl bg-[#e0f4ec] p-5 font-medium text-[#2fb67d] ${floatingShadow}`}>
          {message}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className={`rounded-3xl bg-[#edf1f7] p-12 text-center ${pageShadow}`}>
          <p className="text-lg font-semibold text-[#718096]">У вас немає бронювань.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => openBooking(booking)}
              className={`rounded-3xl bg-[#edf1f7] p-6 text-left transition-all duration-200 hover:scale-[1.01] ${activeInsetShadow} ${floatingShadow}`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(booking.status)}`}>
                  {normalizeBookingStatus(booking.status)}
                </span>
                <span className="text-xl font-bold text-[#2d3748]">{booking.totalPrice.toFixed(2)} ₴</span>
              </div>

              <h3 className="text-xl font-bold text-[#2d3748]">{booking.roomTypeName}</h3>
              <p className="mt-1 text-sm text-[#718096]">
                Номер: {booking.assignedRoomNumber ?? 'буде призначено'}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className={`rounded-2xl bg-[#edf1f7] p-3 ${insetShadow}`}>
                  <p className="text-[#718096]">Заїзд</p>
                  <p className="font-semibold">{formatDate(booking.checkInDate)}</p>
                </div>
                <div className={`rounded-2xl bg-[#edf1f7] p-3 ${insetShadow}`}>
                  <p className="text-[#718096]">Виїзд</p>
                  <p className="font-semibold">{formatDate(booking.checkOutDate)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2d3748]/20 p-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-[#edf1f7] p-7 ${pageShadow}`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(selectedBooking.status)}`}>
                  {normalizeBookingStatus(selectedBooking.status)}
                </p>
                <h2 className="text-2xl font-bold">Деталі бронювання</h2>
                <p className="text-[#718096]">ID: {selectedBooking.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className={`rounded-2xl bg-[#edf1f7] px-4 py-2 font-semibold text-[#718096] transition hover:text-[#2d3748] ${floatingShadow}`}
              >
                Закрити
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Тип номера" value={selectedBooking.roomTypeName} />
              <InfoBlock label="Номер" value={selectedBooking.assignedRoomNumber ?? 'буде призначено'} />
              <InfoBlock label="Дата заїзду" value={formatDate(selectedBooking.checkInDate)} />
              <InfoBlock label="Дата виїзду" value={formatDate(selectedBooking.checkOutDate)} />
              <InfoBlock label="Сума" value={`${selectedBooking.totalPrice.toFixed(2)} ₴`} />
              <InfoBlock label="Статус" value={normalizeBookingStatus(selectedBooking.status)} />
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit(handleUpdateDates)}>
              <div>
                <h3 className="text-lg font-bold">Змінити дати</h3>
                <p className="text-sm text-[#718096]">Зміна доступна лише для бронювань зі статусом Pending або Confirmed.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DateField label="Нова дата заїзду" error={errors.checkInDate?.message} {...register('checkInDate')} />
                <DateField label="Нова дата виїзду" error={errors.checkOutDate?.message} {...register('checkOutDate')} />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={!canModify(selectedBooking) || busyAction === 'update'}
                  className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-bold text-white transition hover:bg-[#416ce0] ${activeInsetShadow} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {busyAction === 'update' ? 'Оновлення...' : 'Зберегти дати'}
                </button>

                <button
                  type="button"
                  disabled={!canModify(selectedBooking) || busyAction === 'cancel'}
                  onClick={() => setBookingToCancel(selectedBooking)}
                  className={`rounded-2xl bg-[#f7e4e4] px-5 py-3 font-bold text-[#e45858] transition hover:bg-[#f2d5d5] ${activeInsetShadow} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Скасувати бронювання
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/25 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-[28px] bg-[#edf1f7] p-7 ${pageShadow}`}>
            <h2 className="text-2xl font-bold">Скасувати бронювання?</h2>
            <p className="mt-3 text-[#718096]">
              Цю дію не можна буде відмінити з кабінету гостя. Бронювання отримає статус Cancelled.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={busyAction === 'cancel'}
                className="rounded-2xl bg-[#e45858] px-5 py-3 font-bold text-white transition hover:bg-[#d64d4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === 'cancel' ? 'Скасування...' : 'Так, скасувати'}
              </button>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={busyAction === 'cancel'}
                className={`rounded-2xl bg-[#edf1f7] px-5 py-3 font-bold text-[#718096] transition hover:text-[#2d3748] ${floatingShadow}`}
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InfoBlockProps {
  label: string;
  value: string;
}

const InfoBlock = ({ label, value }: InfoBlockProps) => (
  <div className={`rounded-2xl bg-[#edf1f7] p-4 ${insetShadow}`}>
    <p className="text-sm text-[#718096]">{label}</p>
    <p className="mt-1 font-bold text-[#2d3748]">{value}</p>
  </div>
);

interface DateFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const DateField = ({ label, error, ...props }: DateFieldProps) => (
  <label className="block">
    <span className="mb-2 block font-semibold text-[#2d3748]">{label}</span>
    <input
      type="date"
      className={`w-full rounded-2xl bg-[#edf1f7] px-4 py-3 text-[#2d3748] outline-none transition focus:shadow-[0_0_0_3px_rgba(79,124,255,0.22),inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)] ${insetShadow}`}
      {...props}
    />
    {error && <span className="mt-2 block text-sm font-medium text-[#e45858]">{error}</span>}
  </label>
);

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState, type InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { normalizeBookingStatus, type BookingStatusName } from '../../lib/bookingStatus';
import type { BookingDto } from '../../types/booking';
import { useAuthStore } from '../auth/stores/authStore';
import { cancelBooking, getBookingById, updateBookingDates } from './bookingApi';

const raisedShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const floatingShadow = 'shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]';
const insetShadow = 'shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';
const activeInsetShadow = 'active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';

const statusStyles: Record<BookingStatusName, string> = {
  Pending: 'bg-[#e8ecf2] text-[#718096]',
  Confirmed: 'bg-[#e4eefc] text-[#4f7cff]',
  CheckedIn: 'bg-[#e0f4ec] text-[#2fb67d]',
  CheckedOut: 'bg-[#e5e9ef] text-[#718096]',
  Cancelled: 'bg-[#f7e4e4] text-[#e45858]',
};

const dateSchema = z.object({
  checkInDate: z.string().min(1, 'Вкажіть дату заїзду'),
  checkOutDate: z.string().min(1, 'Вкажіть дату виїзду'),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
  message: 'Дата виїзду повинна бути пізніше дати заїзду',
  path: ['checkOutDate'],
});

type DateFormValues = z.infer<typeof dateSchema>;

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA');
const formatMoney = (value: number) => `${value.toFixed(2)} грн`;
const toDateInputValue = (value: string) => value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date(value).toISOString().slice(0, 10);
const hasRole = (roles: string[], role: string) =>
  roles.some((userRole) => userRole.toLowerCase() === role.toLowerCase());

const canGuestModifyBooking = (booking: BookingDto) => {
  const status = normalizeBookingStatus(booking.status);
  return status === 'Pending' || status === 'Confirmed';
};

const isMoreThan24HoursBeforeCheckIn = (booking: BookingDto) =>
  new Date(booking.checkInDate).getTime() - Date.now() > 24 * 60 * 60 * 1000;

const canGuestUpdateDates = (booking: BookingDto) =>
  canGuestModifyBooking(booking) && new Date(booking.checkInDate).getTime() > Date.now();

const canGuestCancelBooking = (booking: BookingDto) =>
  canGuestModifyBooking(booking) && isMoreThan24HoursBeforeCheckIn(booking);

const getGuestDisplayName = (booking: BookingDto) => {
  const guestName = booking.guestFullName?.trim();
  if (guestName) return guestName;
  if (booking.guestId) return `Гість ${booking.guestId.slice(0, 8)}`;
  return 'Профіль гостя не знайдено';
};

const getRoomDisplay = (booking: BookingDto, isStaff: boolean) => {
  const roomNumber = booking.assignedRoomNumber?.trim();

  if (isStaff) {
    return {
      title: roomNumber ? `Номер ${roomNumber}` : 'Кімнату не призначено',
      description: roomNumber ? 'Фізична кімната вже закріплена за бронюванням.' : 'Рецепція має призначити кімнату перед заселенням.',
      isHiddenForGuest: false,
    };
  }

  const status = normalizeBookingStatus(booking.status);
  if (status === 'Pending' || status === 'Confirmed') {
    return {
      title: 'Номер кімнати визначається безпосередньо при заселенні на рецепції',
      description: 'Ми підберемо доступну кімнату вибраної категорії у день вашого прибуття.',
      isHiddenForGuest: true,
    };
  }

  return {
    title: roomNumber ? `Номер ${roomNumber}` : 'Кімнату не призначено',
    description: roomNumber ? 'Ви вже заселені у цю кімнату.' : 'Номер кімнати ще не вказано.',
    isHiddenForGuest: false,
  };
};

const BookingStatusBadge = ({ status }: { status: string | number }) => {
  const normalizedStatus = normalizeBookingStatus(status);

  return (
    <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[normalizedStatus]} ${insetShadow}`}>
      {normalizedStatus}
    </span>
  );
};

export const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const roles = useAuthStore((state) => state.roles);
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'cancel' | 'update' | null>(null);
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

  const isStaff = useMemo(
    () => hasRole(roles, 'Receptionist') || hasRole(roles, 'Admin'),
    [roles],
  );
  const isAdmin = useMemo(() => hasRole(roles, 'Admin'), [roles]);

  const loadBooking = async () => {
    if (!id) {
      setError('Не вказано ID бронювання.');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const data = await getBookingById(id);
      setBooking(data);
    } catch {
      setError('Не вдалося завантажити деталі бронювання.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBooking();
  }, [id]);

  const openDateModal = () => {
    if (!booking) return;

    reset({
      checkInDate: toDateInputValue(booking.checkInDate),
      checkOutDate: toDateInputValue(booking.checkOutDate),
    });
    setError(null);
    setMessage(null);
    setIsDateModalOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Скасувати це бронювання?')) return;

    try {
      setBusyAction('cancel');
      setError(null);
      setMessage(null);
      await cancelBooking(booking.id);
      setBooking({ ...booking, status: 'Cancelled' });
      setMessage('Бронювання скасовано.');
    } catch {
      setError('Не вдалося скасувати бронювання. Можливо, його статус уже не дозволяє цю дію.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateDates = async (values: DateFormValues) => {
    if (!booking) return;

    const roomId = booking.assignedRoomId ?? booking.roomId;
    if (!roomId) {
      setError('Для цього бронювання не знайдено кімнату, тому дати змінити неможливо.');
      return;
    }

    try {
      setBusyAction('update');
      setError(null);
      setMessage(null);
      await updateBookingDates(booking.id, {
        roomId,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
      });
      const refreshedBooking = await getBookingById(booking.id);
      setBooking(refreshedBooking);
      setIsDateModalOpen(false);
      setMessage('Дати бронювання оновлено.');
    } catch {
      setError('Не вдалося змінити дати. Перевірте доступність номера на вибраний період.');
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8dfeb] border-t-[#4f7cff]" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className={`rounded-3xl bg-[#f7e4e4] p-5 font-medium text-[#e45858] ${insetShadow}`}>
        {error}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={`rounded-3xl bg-[#f7e4e4] p-5 font-medium text-[#e45858] ${insetShadow}`}>
        Бронювання не знайдено.
      </div>
    );
  }

  const status = normalizeBookingStatus(booking.status);
  const roomDisplay = getRoomDisplay(booking, isStaff);
  const canUpdateDates = isStaff
    ? status === 'Pending' || status === 'Confirmed' || status === 'CheckedIn'
    : canGuestUpdateDates(booking);
  const canCancel = isStaff
    ? (isAdmin ? status !== 'Cancelled' && status !== 'CheckedOut' : status === 'Pending' || status === 'Confirmed')
    : canGuestCancelBooking(booking);
  const hasActions = canUpdateDates || canCancel;
  const invoiceTotal = booking.invoiceTotalAmount ?? booking.totalPrice;
  const invoicePaid = booking.invoicePaidAmount ?? 0;
  const invoiceRemaining = booking.invoiceRemainingAmount ?? invoiceTotal - invoicePaid;
  const paymentStatus = booking.invoiceIsClosed ? 'Оплачено' : status === 'Cancelled' ? 'Скасовано' : 'Очікує оплати';

  return (
    <div className="min-h-full bg-[#edf1f7] text-[#2d3748]">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <BookingStatusBadge status={booking.status} />
          <h1 className="mt-4 text-3xl font-bold">Деталі бронювання</h1>
          <p className="mt-2 text-[#718096]">Ваше проживання, деталі кімнати та фінансовий рахунок.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/bookings')}
          className={`rounded-2xl bg-[#edf1f7] px-5 py-3 font-semibold text-[#4f7cff] transition-all duration-200 hover:scale-[1.02] ${activeInsetShadow} ${raisedShadow}`}
        >
          Назад до списку
        </button>
      </div>

      {error && (
        <div className={`mb-6 rounded-3xl bg-[#f7e4e4] p-4 font-medium text-[#e45858] ${insetShadow}`}>
          {error}
        </div>
      )}

      {message && (
        <div className={`mb-6 rounded-3xl bg-[#e0f4ec] p-4 font-medium text-[#2fb67d] ${insetShadow}`}>
          {message}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={`rounded-3xl bg-[#edf1f7] p-7 ${floatingShadow}`}>
          <div className="rounded-3xl bg-[#f1f4f9] p-6 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4f7cff]">Резюме проживання</p>
            <h2 className="mt-3 text-3xl font-bold">{booking.roomTypeName}</h2>
            <p className="mt-2 text-[#718096]">Бронювання #{booking.id.slice(0, 8)}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DatePanel label="Заїзд" date={booking.checkInDate} hint="Початок проживання" />
            <DatePanel label="Виїзд" date={booking.checkOutDate} hint="Завершення проживання" />
          </div>

          <div className={`mt-6 rounded-3xl bg-[#edf1f7] p-5 ${raisedShadow}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#718096]">Статус замовлення</p>
                <div className="mt-3">
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>
              <div className={`rounded-2xl bg-[#edf1f7] px-5 py-4 text-right ${insetShadow}`}>
                <p className="text-sm text-[#718096]">Вартість</p>
                <p className="text-2xl font-bold">{formatMoney(booking.totalPrice)}</p>
              </div>
            </div>
          </div>

          <div className={`mt-6 rounded-3xl bg-[#edf1f7] p-5 ${roomDisplay.isHiddenForGuest ? insetShadow : raisedShadow}`}>
            <p className="text-sm font-semibold text-[#718096]">Кімната</p>
            <h3 className="mt-2 text-xl font-bold">{roomDisplay.title}</h3>
            <p className="mt-2 text-[#718096]">{roomDisplay.description}</p>
          </div>
        </section>

        <aside className="space-y-6">
          <section className={`rounded-3xl bg-[#edf1f7] p-6 ${raisedShadow}`}>
            <h2 className="text-2xl font-bold">Детальна інформація</h2>
            <div className="mt-5 space-y-4">
              <InfoRow label="Гість" value={getGuestDisplayName(booking)} />
              <InfoRow label="ID гостя" value={booking.guestId ?? 'Профіль гостя не знайдено'} />
              <InfoRow label="Категорія кімнати" value={booking.roomTypeName} />
              <InfoRow label="Фізична кімната" value={isStaff ? roomDisplay.title : roomDisplay.isHiddenForGuest ? 'Приховано до заселення' : roomDisplay.title} />
            </div>
          </section>

          <section className={`rounded-3xl bg-[#edf1f7] p-6 ${raisedShadow}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Рахунок</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.invoiceIsClosed ? 'bg-[#e0f4ec] text-[#2fb67d]' : 'bg-[#fff5dc] text-[#f0a500]'} ${insetShadow}`}>
                {paymentStatus}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <InfoRow label="Вартість проживання" value={formatMoney(booking.totalPrice)} />
              <InfoRow label="Загальна сума" value={formatMoney(invoiceTotal)} strong />
              <InfoRow label="Сплачено" value={formatMoney(invoicePaid)} />
              <InfoRow label="До сплати" value={formatMoney(Math.max(invoiceRemaining, 0))} strong />
            </div>
          </section>

          <section className={`rounded-3xl bg-[#edf1f7] p-6 ${raisedShadow}`}>
            <h2 className="text-2xl font-bold">Дії</h2>
            {hasActions ? (
              <div className="mt-5 grid gap-3">
                {canUpdateDates && (
                  <button
                    type="button"
                    onClick={openDateModal}
                    disabled={busyAction !== null}
                    className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-bold text-[#f1f4f9] transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 ${activeInsetShadow} ${raisedShadow}`}
                  >
                    {status === 'CheckedIn' && isStaff ? 'Продовжити проживання' : 'Змінити дати'}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={busyAction !== null}
                    className={`rounded-2xl bg-[#f7e4e4] px-5 py-3 font-bold text-[#e45858] transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 ${activeInsetShadow} ${raisedShadow}`}
                  >
                    {busyAction === 'cancel' ? 'Скасування...' : 'Скасувати бронювання'}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-4 text-[#718096]">
                Для поточного статусу бронювання дії недоступні.
              </p>
            )}
          </section>
        </aside>
      </div>

      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/25 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit(handleUpdateDates)}
            className={`w-full max-w-lg rounded-[28px] bg-[#edf1f7] p-7 ${floatingShadow}`}
          >
            <h2 className="text-2xl font-bold">Змінити дати</h2>
            <p className="mt-2 text-[#718096]">Оберіть нові дати проживання.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DateInput label="Дата заїзду" error={errors.checkInDate?.message} {...register('checkInDate')} />
              <DateInput label="Дата виїзду" error={errors.checkOutDate?.message} {...register('checkOutDate')} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busyAction === 'update'}
                className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-bold text-[#f1f4f9] transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 ${activeInsetShadow} ${raisedShadow}`}
              >
                {busyAction === 'update' ? 'Збереження...' : 'Зберегти'}
              </button>
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                disabled={busyAction === 'update'}
                className={`rounded-2xl bg-[#edf1f7] px-5 py-3 font-bold text-[#718096] transition-all duration-200 hover:text-[#2d3748] disabled:cursor-not-allowed disabled:opacity-60 ${raisedShadow}`}
              >
                Закрити
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  strong?: boolean;
}

const InfoRow = ({ label, value, strong = false }: InfoRowProps) => (
  <div className={`rounded-2xl bg-[#edf1f7] p-4 ${insetShadow}`}>
    <p className="text-sm text-[#718096]">{label}</p>
    <p className={`mt-1 break-words ${strong ? 'text-xl font-bold' : 'font-semibold'} text-[#2d3748]`}>{value}</p>
  </div>
);

interface DatePanelProps {
  label: string;
  date: string;
  hint: string;
}

const DatePanel = ({ label, date, hint }: DatePanelProps) => (
  <div className={`rounded-3xl bg-[#edf1f7] p-5 ${raisedShadow}`}>
    <p className="text-sm font-semibold text-[#718096]">{label}</p>
    <p className="mt-2 text-2xl font-bold">{formatDate(date)}</p>
    <p className="mt-1 text-sm text-[#718096]">{hint}</p>
  </div>
);

interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const DateInput = ({ label, error, ...props }: DateInputProps) => (
  <label className="block">
    <span className="mb-2 block font-semibold text-[#2d3748]">{label}</span>
    <input
      type="date"
      className={`w-full rounded-2xl bg-[#edf1f7] px-4 py-3 text-[#2d3748] outline-none transition focus:shadow-[0_0_0_3px_rgba(79,124,255,0.22),inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] ${insetShadow}`}
      {...props}
    />
    {error && <span className="mt-2 block text-sm font-medium text-[#e45858]">{error}</span>}
  </label>
);

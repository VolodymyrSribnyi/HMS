import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import type { RoomDto } from '../../types/rooms';
import { createGuestBooking, getRoomById } from './guestApi';

const createBookingSchema = z.object({
  confirm: z.boolean().refine((value) => value, 'Підтвердьте бронювання'),
});

type CreateBookingFormInputs = z.infer<typeof createBookingSchema>;

interface BookingLocationState {
  room?: RoomDto;
}

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

const isBookingLocationState = (value: unknown): value is BookingLocationState => {
  return typeof value === 'object' && value !== null && 'room' in value;
};

export const CreateBookingPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateRoom = isBookingLocationState(location.state) ? location.state.room : undefined;
  const [room, setRoom] = useState<RoomDto | undefined>(stateRoom);
  const [isLoadingRoom, setIsLoadingRoom] = useState(!stateRoom);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkInDate = searchParams.get('checkInDate') ?? '';
  const checkOutDate = searchParams.get('checkOutDate') ?? '';
  const guestCount = searchParams.get('guestCount') ?? '1';

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) {
      return 0;
    }

    const diff = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
    return Math.max(0, Math.round(diff / (24 * 60 * 60 * 1000)));
  }, [checkInDate, checkOutDate]);

  const totalPrice = room ? nights * room.basePrice : 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormInputs>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      confirm: false,
    },
  });

  useEffect(() => {
    const fetchRoom = async () => {
      if (room || !roomId) {
        setIsLoadingRoom(false);
        return;
      }

      try {
        setServerError(null);
        setIsLoadingRoom(true);
        const data = await getRoomById(roomId);
        setRoom(data);
      } catch (error: unknown) {
        setServerError(getApiError(error) ?? 'Не вдалося завантажити вибраний номер.');
      } finally {
        setIsLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [room, roomId]);

  const onSubmit = async () => {
    if (!roomId || !checkInDate || !checkOutDate || nights <= 0) {
      setServerError('Дані бронювання неповні. Поверніться до пошуку номерів.');
      return;
    }

    try {
      setServerError(null);
      await createGuestBooking({
        roomId,
        checkInDate,
        checkOutDate,
      });
      setSuccessMessage('Бронювання успішно створено. Перенаправляємо до ваших бронювань...');
      window.setTimeout(() => navigate('/bookings'), 1200);
    } catch (error: unknown) {
      setServerError(getApiError(error) ?? 'Не вдалося створити бронювання. Спробуйте ще раз.');
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-red-600 shadow-[inset_4px_4px_10px_rgba(163,177,198,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
        Номер не знайдено. <Link to="/guest/search" className="font-semibold underline">Повернутися до пошуку</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Підтвердження бронювання</h1>
        <p className="mt-2 text-slate-500">Перевірте деталі перед створенням бронювання.</p>
      </div>

      {serverError && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-600 shadow-[inset_4px_4px_10px_rgba(163,177,198,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-green-50 p-4 text-green-700 shadow-[inset_4px_4px_10px_rgba(163,177,198,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl bg-[#edf1f7] p-6 shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{room.roomTypeName}</h2>
            <p className="mt-1 text-slate-500">Номер {room.roomNumber}, поверх {room.floor}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right shadow-[inset_4px_4px_10px_rgba(163,177,198,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
            <p className="text-sm text-blue-700">Загальна сума</p>
            <p className="text-2xl font-bold text-blue-800">{totalPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-400">Заїзд</p>
            <p className="mt-1 font-semibold text-slate-800">{new Date(checkInDate).toLocaleDateString('uk-UA')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Виїзд</p>
            <p className="mt-1 font-semibold text-slate-800">{new Date(checkOutDate).toLocaleDateString('uk-UA')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Гості / ночі</p>
            <p className="mt-1 font-semibold text-slate-800">{guestCount} / {nights}</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-[#edf1f7] p-6 shadow-[8px_8px_16px_rgba(163,177,198,0.45),-8px_-8px_16px_rgba(255,255,255,0.9)]">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            {...register('confirm')}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Підтверджую, що хочу забронювати вибраний номер на зазначені дати.</span>
        </label>
        {errors.confirm && <p className="mt-2 text-sm text-red-500">{errors.confirm.message}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/guest/search"
            className="rounded-2xl bg-[#edf1f7] px-4 py-3 text-center font-semibold text-slate-700 shadow-[8px_8px_16px_rgba(163,177,198,0.35),-8px_-8px_16px_rgba(255,255,255,0.85)] transition-all hover:scale-[1.01]"
          >
            Назад до пошуку
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || Boolean(successMessage)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4f7cff] px-4 py-3 font-semibold text-white shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.01] disabled:bg-blue-400"
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSubmitting ? 'Створення...' : 'Підтвердити бронювання'}
          </button>
        </div>
      </form>
    </div>
  );
};

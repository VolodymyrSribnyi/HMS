import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import type { RoomDto } from '../../types/rooms';
import { searchAvailableRooms } from './guestApi';

const today = new Date().toISOString().split('T')[0];

const searchRoomsSchema = z
  .object({
    checkInDate: z.string().min(1, 'Вкажіть дату заїзду'),
    checkOutDate: z.string().min(1, 'Вкажіть дату виїзду'),
    guestCount: z.number().int().min(1, 'Мінімум 1 гість').max(10, 'Максимум 10 гостей'),
  })
  .refine((data) => data.checkInDate >= today, {
    message: 'Дата заїзду не може бути в минулому',
    path: ['checkInDate'],
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: 'Дата виїзду має бути пізніше дати заїзду',
    path: ['checkOutDate'],
  });

type SearchRoomsFormInputs = z.infer<typeof searchRoomsSchema>;

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

export const SearchRoomsPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SearchRoomsFormInputs>({
    resolver: zodResolver(searchRoomsSchema),
    defaultValues: {
      checkInDate: today,
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      guestCount: 1,
    },
  });

  const onSubmit = async (data: SearchRoomsFormInputs) => {
    try {
      setServerError(null);
      const availableRooms = await searchAvailableRooms(data);
      setRooms(availableRooms);
      setHasSearched(true);
    } catch (error: unknown) {
      setServerError(getApiError(error) ?? 'Не вдалося знайти доступні номери. Спробуйте ще раз.');
      setRooms([]);
      setHasSearched(true);
    }
  };

  const handleBook = (room: RoomDto) => {
    const values = getValues();
    const searchParams = new URLSearchParams({
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      guestCount: String(values.guestCount),
    });

    navigate(`/guest/book/${room.id}?${searchParams.toString()}`, {
      state: { room },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Пошук номерів</h1>
        <p className="mt-2 text-slate-500">Оберіть дати проживання і кількість гостей.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-[#edf1f7] p-6 shadow-[8px_8px_16px_rgba(163,177,198,0.45),-8px_-8px_16px_rgba(255,255,255,0.9)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Дата заїзду</label>
            <input
              type="date"
              min={today}
              {...register('checkInDate')}
              className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)] transition-all ${
                errors.checkInDate ? 'focus:ring-2 focus:ring-red-200' : 'focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {errors.checkInDate && <p className="mt-1 text-sm text-red-500">{errors.checkInDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Дата виїзду</label>
            <input
              type="date"
              min={today}
              {...register('checkOutDate')}
              className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)] transition-all ${
                errors.checkOutDate ? 'focus:ring-2 focus:ring-red-200' : 'focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {errors.checkOutDate && <p className="mt-1 text-sm text-red-500">{errors.checkOutDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Кількість гостей</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register('guestCount', { valueAsNumber: true })}
              className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)] transition-all ${
                errors.guestCount ? 'focus:ring-2 focus:ring-red-200' : 'focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {errors.guestCount && <p className="mt-1 text-sm text-red-500">{errors.guestCount.message}</p>}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#4f7cff] p-3 font-semibold text-white shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.01] disabled:bg-blue-400"
            >
              {isSubmitting ? 'Пошук...' : 'Знайти номери'}
            </button>
          </div>
        </div>
      </form>

      {serverError && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-600 shadow-[inset_4px_4px_10px_rgba(163,177,198,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
          {serverError}
        </div>
      )}

      {hasSearched && !serverError && rooms.length === 0 && (
        <div className="rounded-3xl bg-[#edf1f7] p-10 text-center text-slate-500 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
          На вибрані дати доступних номерів не знайдено.
        </div>
      )}

      {rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="flex flex-col justify-between rounded-3xl bg-[#edf1f7] p-6 shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]">
              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{room.roomTypeName}</h2>
                    <p className="text-sm text-slate-500">Номер {room.roomNumber}, поверх {room.floor}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Доступний
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-400">Ціна за ніч:</span> {room.basePrice.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-400">Статус:</span> {room.status}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleBook(room)}
                className="mt-6 rounded-2xl bg-[#4f7cff] px-4 py-3 font-semibold text-white shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.01]"
              >
                Забронювати
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

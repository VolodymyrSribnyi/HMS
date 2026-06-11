import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createRoomType, deleteRoomType, getRoomTypes, updateRoomType } from './roomsApi';
import type { RoomTypeDto, RoomTypePayload } from '../../types/rooms';

const panelShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const floatingShadow = 'shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]';
const insetShadow = 'shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]';
const buttonShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Вкажіть назву типу номера'),
  capacity: z.number().int().min(1, 'Місткість має бути не менше 1'),
  basePrice: z.number().min(0, 'Ціна не може бути відʼємною'),
  description: z.string().optional(),
  amenities: z.string().optional(),
});

type RoomTypeFormInputs = z.infer<typeof roomTypeSchema>;

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

const toPayload = (data: RoomTypeFormInputs): RoomTypePayload => ({
  name: data.name,
  capacity: data.capacity,
  basePrice: data.basePrice,
  description: data.description?.trim() || null,
  amenities: data.amenities?.trim() || null,
});

export const RoomsPage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([]);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeDto | null>(null);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<RoomTypeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomTypeFormInputs>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: '',
      capacity: 1,
      basePrice: 0,
      description: '',
      amenities: '',
    },
  });

  const loadRoomTypes = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setRoomTypes(await getRoomTypes());
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося завантажити типи номерів.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const openCreateModal = () => {
    setEditingRoomType(null);
    reset({
      name: '',
      capacity: 1,
      basePrice: 0,
      description: '',
      amenities: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (roomType: RoomTypeDto) => {
    setEditingRoomType(roomType);
    reset({
      name: roomType.name,
      capacity: roomType.capacity,
      basePrice: roomType.basePrice,
      description: roomType.description ?? '',
      amenities: roomType.amenities ?? '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoomType(null);
  };

  const onSubmit = async (data: RoomTypeFormInputs) => {
    try {
      setError(null);
      const payload = toPayload(data);

      if (editingRoomType) {
        await updateRoomType(editingRoomType.id, payload);
        setMessage(`Тип номера "${payload.name}" оновлено.`);
      } else {
        await createRoomType(payload);
        setMessage(`Тип номера "${payload.name}" створено.`);
      }

      closeModal();
      await loadRoomTypes();
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося зберегти тип номера.');
    }
  };

  const confirmDelete = async () => {
    if (!roomTypeToDelete) {
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);
      await deleteRoomType(roomTypeToDelete.id);
      setRoomTypes((current) => current.filter((roomType) => roomType.id !== roomTypeToDelete.id));
      setMessage(`Тип номера "${roomTypeToDelete.name}" видалено.`);
      setRoomTypeToDelete(null);
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося видалити тип номера.');
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Типи номерів</h1>
          <p className="mt-2 text-[#718096]">Керуйте категоріями номерів, місткістю, цінами та зручностями.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] ${buttonShadow}`}
        >
          Додати тип
        </button>
      </div>

      {message && <div className={`rounded-3xl bg-green-50 p-4 text-[#2fb67d] ${insetShadow}`}>{message}</div>}
      {error && <div className={`rounded-3xl bg-red-50 p-4 text-[#e45858] ${insetShadow}`}>{error}</div>}

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        {roomTypes.length === 0 ? (
          <div className={`rounded-3xl bg-[#edf1f7] p-10 text-center text-[#718096] ${insetShadow}`}>
            Типи номерів ще не створені.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {roomTypes.map((roomType) => (
              <article key={roomType.id} className={`rounded-3xl bg-[#edf1f7] p-6 ${floatingShadow}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{roomType.name}</h2>
                    <p className="mt-1 text-[#718096]">Місткість: {roomType.capacity}</p>
                  </div>
                  <div className={`rounded-2xl bg-[#edf1f7] px-4 py-3 text-right ${insetShadow}`}>
                    <p className="text-xs font-semibold uppercase text-[#718096]">Ціна</p>
                    <p className="text-lg font-bold text-[#4f7cff]">{roomType.basePrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-[#718096]">
                  <div className={`rounded-2xl bg-[#edf1f7] p-4 ${insetShadow}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide">Опис</p>
                    <p className="mt-1 text-[#2d3748]">{roomType.description || 'Опис не задано.'}</p>
                  </div>
                  <div className={`rounded-2xl bg-[#edf1f7] p-4 ${insetShadow}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide">Зручності</p>
                    <p className="mt-1 text-[#2d3748]">{roomType.amenities || 'Зручності не задано.'}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(roomType)}
                    className={`rounded-2xl bg-[#edf1f7] px-4 py-3 font-semibold text-[#4f7cff] transition-all hover:scale-[1.02] ${buttonShadow}`}
                  >
                    Редагувати
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomTypeToDelete(roomType)}
                    className={`rounded-2xl bg-[#edf1f7] px-4 py-3 font-semibold text-[#e45858] transition-all hover:scale-[1.02] ${buttonShadow}`}
                  >
                    Видалити
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/30 p-4">
          <div className={`w-full max-w-2xl rounded-[28px] bg-[#edf1f7] p-6 ${floatingShadow}`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{editingRoomType ? 'Редагувати тип номера' : 'Додати тип номера'}</h2>
                <p className="mt-1 text-[#718096]">Заповніть параметри категорії номера.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className={`h-10 w-10 rounded-2xl bg-[#edf1f7] text-xl font-bold text-[#718096] transition-all hover:scale-[1.04] ${buttonShadow}`}
                aria-label="Закрити модальне вікно"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Назва</span>
                  <input
                    {...register('name')}
                    className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                    placeholder="Standard"
                  />
                  {errors.name && <p className="mt-2 text-sm text-[#e45858]">{errors.name.message}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Місткість</span>
                  <input
                    type="number"
                    {...register('capacity', { valueAsNumber: true })}
                    className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                    min={1}
                  />
                  {errors.capacity && <p className="mt-2 text-sm text-[#e45858]">{errors.capacity.message}</p>}
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Базова ціна за ніч</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('basePrice', { valueAsNumber: true })}
                  className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                  min={0}
                />
                {errors.basePrice && <p className="mt-2 text-sm text-[#e45858]">{errors.basePrice.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Опис</span>
                <textarea
                  {...register('description')}
                  className={`min-h-24 w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                  placeholder="Короткий опис типу номера"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Зручності</span>
                <input
                  {...register('amenities')}
                  className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                  placeholder="Wi-Fi, TV, shower"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`rounded-2xl bg-[#edf1f7] px-5 py-3 font-semibold text-[#718096] transition-all hover:scale-[1.02] ${buttonShadow}`}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-semibold text-white transition-all hover:scale-[1.02] disabled:bg-[#9bb4ff] ${buttonShadow}`}
                >
                  {isSubmitting ? 'Збереження...' : editingRoomType ? 'Зберегти зміни' : 'Створити тип'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomTypeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/30 p-4">
          <div className={`w-full max-w-md rounded-[28px] bg-[#edf1f7] p-6 ${floatingShadow}`}>
            <h2 className="text-2xl font-bold">Підтвердження видалення</h2>
            <p className="mt-3 text-[#718096]">
              Ви дійсно хочете видалити тип номера <strong className="text-[#2d3748]">{roomTypeToDelete.name}</strong>?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRoomTypeToDelete(null)}
                disabled={isDeleting}
                className={`rounded-2xl bg-[#edf1f7] px-5 py-3 font-semibold text-[#718096] transition-all hover:scale-[1.02] ${buttonShadow}`}
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`rounded-2xl bg-[#e45858] px-5 py-3 font-semibold text-white transition-all hover:scale-[1.02] disabled:bg-[#e8a4a4] ${buttonShadow}`}
              >
                {isDeleting ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

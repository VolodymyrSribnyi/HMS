import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { apiClient } from '../../lib/axios';
import type { RoomDto, RoomStatus, RoomTypeDto } from '../../types/rooms';

const panelShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const floatingShadow = 'shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]';
const insetShadow = 'shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]';
const buttonShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';

const roomStatuses: RoomStatus[] = ['Available', 'Occupied', 'NeedsCleaning', 'OutOfOrder'];

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Вкажіть номер кімнати').max(20, 'Максимум 20 символів'),
  roomTypeId: z.string().min(1, 'Оберіть тип номера'),
  floor: z.number().int().min(0, 'Поверх не може бути відʼємним'),
  status: z.enum(['Available', 'Occupied', 'NeedsCleaning', 'OutOfOrder']),
});

type RoomFormInputs = z.infer<typeof roomSchema>;

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

const getRooms = async (): Promise<RoomDto[]> => {
  const response = await apiClient.get('/rooms');
  return response.data;
};

const getRoomTypes = async (): Promise<RoomTypeDto[]> => {
  const response = await apiClient.get('/roomtype');
  return response.data;
};

const createRoom = async (payload: RoomFormInputs): Promise<void> => {
  await apiClient.post('/rooms', payload);
};

const updateRoom = async (room: RoomDto, payload: RoomFormInputs): Promise<void> => {
  await apiClient.put(`/rooms/${room.id}`, {
    ...payload,
    rowVersion: room.rowVersion,
  });
};

const deleteRoom = async (room: RoomDto): Promise<void> => {
  await apiClient.delete(`/rooms/${room.id}`, {
    params: { rowVersion: room.rowVersion },
  });
};

export const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([]);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormInputs>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomNumber: '',
      floor: 1,
      roomTypeId: '',
      status: 'Available',
    },
  });

  const roomsByFloor = useMemo(() => {
    return rooms.reduce<Record<number, RoomDto[]>>((groups, room) => {
      groups[room.floor] = groups[room.floor] ?? [];
      groups[room.floor].push(room);
      return groups;
    }, {});
  }, [rooms]);

  const sortedFloors = useMemo(
    () => Object.keys(roomsByFloor).map(Number).sort((a, b) => a - b),
    [roomsByFloor],
  );

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [roomsData, roomTypesData] = await Promise.all([getRooms(), getRoomTypes()]);
      setRooms(roomsData);
      setRoomTypes(roomTypesData);
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося завантажити номери.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    reset({
      roomNumber: '',
      floor: 1,
      roomTypeId: roomTypes[0]?.id ?? '',
      status: 'Available',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: RoomDto) => {
    setEditingRoom(room);
    reset({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomTypeId: room.roomTypeId,
      status: room.status,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const onSubmit = async (data: RoomFormInputs) => {
    try {
      setError(null);

      if (editingRoom) {
        await updateRoom(editingRoom, data);
        setMessage(`Номер ${data.roomNumber} оновлено.`);
      } else {
        await createRoom(data);
        setMessage('Номер успішно створено.');
      }

      closeModal();
      await loadData();
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося зберегти номер.');
    }
  };

  const confirmDelete = async () => {
    if (!roomToDelete) {
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);
      await deleteRoom(roomToDelete);
      setRooms((current) => current.filter((item) => item.id !== roomToDelete.id));
      setMessage(`Номер ${roomToDelete.roomNumber} видалено.`);
      setRoomToDelete(null);
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося видалити номер.');
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
          <h1 className="text-3xl font-bold">Управління номерами</h1>
          <p className="mt-2 text-[#718096]">Створення, редагування та видалення номерів.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className={`rounded-2xl bg-[#4f7cff] px-5 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:bg-[#9bb4ff] ${buttonShadow}`}
          disabled={roomTypes.length === 0}
        >
          Додати номер
        </button>
      </div>

      {message && <div className={`rounded-3xl bg-green-50 p-4 text-[#2fb67d] ${insetShadow}`}>{message}</div>}
      {error && <div className={`rounded-3xl bg-red-50 p-4 text-[#e45858] ${insetShadow}`}>{error}</div>}

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        {rooms.length === 0 ? (
          <div className={`rounded-3xl bg-[#edf1f7] p-10 text-center text-[#718096] ${insetShadow}`}>
            Номери ще не створені.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedFloors.map((floor) => (
              <div key={floor} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Поверх {floor}</h2>
                  <span className={`rounded-full bg-[#edf1f7] px-4 py-2 text-sm font-semibold text-[#4f7cff] ${insetShadow}`}>
                    {roomsByFloor[floor].length} номерів
                  </span>
                </div>

                <div className="overflow-hidden rounded-3xl bg-[#edf1f7]">
                  {roomsByFloor[floor].map((room, index) => {
                    const isLast = index === roomsByFloor[floor].length - 1;

                    return (
                      <div
                        key={room.id}
                        className={`flex min-h-24 flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${
                          isLast ? '' : 'border-b border-[#d9e0ea]/70'
                        }`}
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-center">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#718096]">Номер</p>
                            <p className="mt-1 text-xl font-bold">{room.roomNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#718096]">Тип</p>
                            <p className="mt-1 font-semibold">{room.roomTypeName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#718096]">Статус</p>
                            <p className="mt-1 font-semibold text-[#4f7cff]">{room.status}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#718096]">Ціна</p>
                            <p className="mt-1 font-semibold">{room.basePrice.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(room)}
                            className={`rounded-2xl bg-[#edf1f7] px-4 py-3 font-semibold text-[#4f7cff] transition-all duration-200 hover:scale-[1.03] ${buttonShadow}`}
                          >
                            Редагувати
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoomToDelete(room)}
                            aria-label={`Видалити номер ${room.roomNumber}`}
                            className={`h-12 w-12 rounded-2xl bg-[#edf1f7] text-xl font-bold text-[#e45858] transition-all duration-200 hover:scale-[1.04] ${buttonShadow}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/30 p-4">
          <div className={`w-full max-w-xl rounded-[28px] bg-[#edf1f7] p-6 ${floatingShadow}`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{editingRoom ? 'Редагувати номер' : 'Додати номер'}</h2>
                <p className="mt-1 text-[#718096]">Заповніть основні дані номера.</p>
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
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2d3748]">RoomNumber</span>
                <input
                  {...register('roomNumber')}
                  className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                  placeholder="Наприклад, 101"
                />
                {errors.roomNumber && <p className="mt-2 text-sm text-[#e45858]">{errors.roomNumber.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2d3748]">RoomTypeId</span>
                <select
                  {...register('roomTypeId')}
                  className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                >
                  <option value="" disabled>Оберіть тип номера</option>
                  {roomTypes.map((roomType) => (
                    <option key={roomType.id} value={roomType.id}>{roomType.name}</option>
                  ))}
                </select>
                {errors.roomTypeId && <p className="mt-2 text-sm text-[#e45858]">{errors.roomTypeId.message}</p>}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2d3748]">Floor</span>
                  <input
                    type="number"
                    {...register('floor', { valueAsNumber: true })}
                    className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                    min={0}
                  />
                  {errors.floor && <p className="mt-2 text-sm text-[#e45858]">{errors.floor.message}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2d3748]">Status</span>
                  <select
                    {...register('status')}
                    className={`w-full rounded-2xl bg-[#edf1f7] p-3 outline-none transition-all focus:ring-2 focus:ring-[#4f7cff]/40 ${insetShadow}`}
                  >
                    {roomStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-2 text-sm text-[#e45858]">{errors.status.message}</p>}
                </label>
              </div>

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
                  {isSubmitting ? 'Збереження...' : editingRoom ? 'Зберегти зміни' : 'Створити номер'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3748]/30 p-4">
          <div className={`w-full max-w-md rounded-[28px] bg-[#edf1f7] p-6 ${floatingShadow}`}>
            <h2 className="text-2xl font-bold">Підтвердження видалення</h2>
            <p className="mt-3 text-[#718096]">
              Ви дійсно хочете видалити номер <strong className="text-[#2d3748]">{roomToDelete.roomNumber}</strong>? Цю дію не можна скасувати.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
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

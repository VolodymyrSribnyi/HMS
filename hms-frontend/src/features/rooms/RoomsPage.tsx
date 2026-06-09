import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createRoom,
  createRoomType,
  deleteRoom,
  deleteRoomType,
  getRooms,
  getRoomTypes,
  updateRoom,
  updateRoomType,
} from './roomsApi';
import {
  type RoomDto,
  type RoomPayload,
  type RoomStatus,
  type RoomTypeDto,
  type RoomTypePayload,
} from '../../types/rooms';

const roomStatuses: RoomStatus[] = ['Available', 'Occupied', 'NeedsCleaning', 'OutOfOrder'];

const emptyRoomTypeForm: RoomTypePayload = {
  name: '',
  capacity: 1,
  basePrice: 0,
  description: '',
  amenities: '',
};

const emptyRoomForm: RoomPayload = {
  roomNumber: '',
  floor: 1,
  status: 'Available',
  roomTypeId: '',
};

const getApiError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error;
  }

  return undefined;
};

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([]);
  const [roomForm, setRoomForm] = useState<RoomPayload>(emptyRoomForm);
  const [roomTypeForm, setRoomTypeForm] = useState<RoomTypePayload>(emptyRoomTypeForm);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomTypeOptions = useMemo(
    () => roomTypes.map((roomType) => ({ value: roomType.id, label: roomType.name })),
    [roomTypes],
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [roomsData, roomTypesData] = await Promise.all([getRooms(), getRoomTypes()]);
      setRooms(roomsData);
      setRoomTypes(roomTypesData);

      if (!roomForm.roomTypeId && roomTypesData.length > 0) {
        setRoomForm((current) => ({ ...current, roomTypeId: roomTypesData[0].id }));
      }
    } catch (err) {
      setError('Не вдалося завантажити номерний фонд.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showResult = (text: string) => {
    setMessage(text);
    setError(null);
  };

  const handleError = (fallback: string, err: unknown) => {
    setError(getApiError(err) ?? fallback);
    setMessage(null);
  };

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomForm({
      ...emptyRoomForm,
      roomTypeId: roomTypes[0]?.id ?? '',
    });
  };

  const resetRoomTypeForm = () => {
    setEditingRoomType(null);
    setRoomTypeForm(emptyRoomTypeForm);
  };

  const handleRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          ...roomForm,
          rowVersion: editingRoom.rowVersion,
        });
        showResult('Номер оновлено.');
      } else {
        await createRoom(roomForm);
        showResult('Номер створено.');
      }

      resetRoomForm();
      await loadData();
    } catch (err) {
      handleError('Не вдалося зберегти номер.', err);
    }
  };

  const handleRoomTypeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload = {
        ...roomTypeForm,
        description: roomTypeForm.description || null,
        amenities: roomTypeForm.amenities || null,
      };

      if (editingRoomType) {
        await updateRoomType(editingRoomType.id, payload);
        showResult('Тип номера оновлено.');
      } else {
        await createRoomType(payload);
        showResult('Тип номера створено.');
      }

      resetRoomTypeForm();
      await loadData();
    } catch (err) {
      handleError('Не вдалося зберегти тип номера.', err);
    }
  };

  const startRoomEdit = (room: RoomDto) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
      roomTypeId: room.roomTypeId,
    });
  };

  const startRoomTypeEdit = (roomType: RoomTypeDto) => {
    setEditingRoomType(roomType);
    setRoomTypeForm({
      name: roomType.name,
      capacity: roomType.capacity,
      basePrice: roomType.basePrice,
      description: roomType.description ?? '',
      amenities: roomType.amenities ?? '',
    });
  };

  const handleRoomDelete = async (room: RoomDto) => {
    try {
      await deleteRoom(room.id, room.rowVersion);
      showResult('Номер видалено.');
      await loadData();
    } catch (err) {
      handleError('Не вдалося видалити номер.', err);
    }
  };

  const handleRoomTypeDelete = async (roomType: RoomTypeDto) => {
    try {
      await deleteRoomType(roomType.id);
      showResult('Тип номера видалено.');
      await loadData();
    } catch (err) {
      handleError('Не вдалося видалити тип номера.', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl font-semibold text-slate-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Номерний фонд</h1>
          <p className="mt-1 text-sm text-slate-500">Створення, редагування та видалення номерів і типів номерів.</p>
        </div>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-800">Номери</h2>
          <button
            type="button"
            onClick={resetRoomForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Додати номер
          </button>
        </div>

        <form onSubmit={handleRoomSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Номер кімнати</span>
            <input
              value={roomForm.roomNumber}
              onChange={(event) => setRoomForm((current) => ({ ...current, roomNumber: event.target.value }))}
              placeholder="Наприклад, 101"
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Поверх</span>
            <input
              value={roomForm.floor}
              onChange={(event) => setRoomForm((current) => ({ ...current, floor: Number(event.target.value) }))}
              type="number"
              min={1}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Статус</span>
            <select
              value={roomForm.status}
              onChange={(event) => setRoomForm((current) => ({ ...current, status: event.target.value as RoomStatus }))}
              className="w-full rounded-lg border border-slate-300 p-2.5"
            >
              {roomStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Тип номера</span>
            <select
              value={roomForm.roomTypeId}
              onChange={(event) => setRoomForm((current) => ({ ...current, roomTypeId: event.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            >
              <option value="" disabled>
                Оберіть тип
              </option>
              {roomTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={roomTypes.length === 0}
            className="self-end rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300"
          >
            {editingRoom ? 'Зберегти номер' : 'Створити номер'}
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Номер</th>
                <th className="p-3">Поверх</th>
                <th className="p-3">Тип</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Ціна</th>
                <th className="p-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-slate-800">{room.roomNumber}</td>
                  <td className="p-3">{room.floor}</td>
                  <td className="p-3">{room.roomTypeName}</td>
                  <td className="p-3">{room.status}</td>
                  <td className="p-3">${room.basePrice.toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => startRoomEdit(room)} className="text-blue-600 hover:text-blue-800">
                        Редагувати
                      </button>
                      <button type="button" onClick={() => handleRoomDelete(room)} className="text-red-600 hover:text-red-800">
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Номери ще не створені.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-800">Типи номерів</h2>
          <button
            type="button"
            onClick={resetRoomTypeForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Додати тип
          </button>
        </div>

        <form onSubmit={handleRoomTypeSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-6">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Назва типу</span>
            <input
              value={roomTypeForm.name}
              onChange={(event) => setRoomTypeForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Наприклад, Standard"
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Місткість, гостей</span>
            <input
              value={roomTypeForm.capacity}
              onChange={(event) => setRoomTypeForm((current) => ({ ...current, capacity: Number(event.target.value) }))}
              type="number"
              min={1}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Базова ціна за ніч</span>
            <input
              value={roomTypeForm.basePrice}
              onChange={(event) => setRoomTypeForm((current) => ({ ...current, basePrice: Number(event.target.value) }))}
              type="number"
              min={0}
              step="0.01"
              required
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Опис</span>
            <input
              value={roomTypeForm.description ?? ''}
              onChange={(event) => setRoomTypeForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Короткий опис"
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
          <button type="submit" className="self-end rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">
            {editingRoomType ? 'Зберегти тип' : 'Створити тип'}
          </button>
          <label className="space-y-1 md:col-span-6">
            <span className="text-sm font-medium text-slate-700">Зручності</span>
            <input
              value={roomTypeForm.amenities ?? ''}
              onChange={(event) => setRoomTypeForm((current) => ({ ...current, amenities: event.target.value }))}
              placeholder="Wi-Fi, кондиціонер, балкон"
              className="w-full rounded-lg border border-slate-300 p-2.5"
            />
          </label>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roomTypes.map((roomType) => (
            <div key={roomType.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{roomType.name}</h3>
                  <p className="text-sm text-slate-500">Місткість: {roomType.capacity}</p>
                </div>
                <div className="font-bold text-slate-800">${roomType.basePrice.toFixed(2)}</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{roomType.description || 'Опис не задано.'}</p>
              <p className="mt-2 text-sm text-slate-500">{roomType.amenities || 'Зручності не задано.'}</p>
              <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-3 text-sm">
                <button type="button" onClick={() => startRoomTypeEdit(roomType)} className="text-blue-600 hover:text-blue-800">
                  Редагувати
                </button>
                <button type="button" onClick={() => handleRoomTypeDelete(roomType)} className="text-red-600 hover:text-red-800">
                  Видалити
                </button>
              </div>
            </div>
          ))}
          {roomTypes.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Типи номерів ще не створені.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

import { useEffect, useState } from 'react';
import type { CleaningTaskDto } from '../../types/housekeeping';
import { completeCleaningTask, getPendingCleaningTasks } from './housekeepingApi';

const floatingCardShadow = 'shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]';
const insetShadow = 'shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]';
const successButtonShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(35,130,88,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.35)]';

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const CleaningTasksPage = () => {
  const [tasks, setTasks] = useState<CleaningTaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskIds, setBusyTaskIds] = useState<string[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const data = await getPendingCleaningTasks();
        setTasks(data);
      } catch (requestError: unknown) {
        setError(getApiError(requestError) ?? 'Не вдалося завантажити завдання на прибирання.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const setTaskBusy = (taskId: string, isBusy: boolean) => {
    setBusyTaskIds((current) =>
      isBusy ? [...current, taskId] : current.filter((id) => id !== taskId),
    );
  };

  const handleComplete = async (taskId: string) => {
    try {
      setError(null);
      setTaskBusy(taskId, true);
      await completeCleaningTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося завершити завдання. Оновіть сторінку і спробуйте ще раз.');
    } finally {
      setTaskBusy(taskId, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8dfeb] border-t-[#2fb67d]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#2d3748]">
      <div>
        <h1 className="text-3xl font-bold">Завдання на прибирання</h1>
        <p className="mt-2 text-[#718096]">Позначайте номери готовими після завершення прибирання.</p>
      </div>

      {error && (
        <div className={`rounded-3xl bg-red-50 p-4 text-[#e45858] ${insetShadow}`}>
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className={`rounded-3xl bg-[#edf1f7] p-10 text-center text-[#718096] ${insetShadow}`}>
          Немає активних завдань на прибирання.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => {
            const isBusy = busyTaskIds.includes(task.id);

            return (
              <article key={task.id} className={`rounded-3xl bg-[#edf1f7] p-6 ${floatingCardShadow}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Номер {task.roomNumber}</h2>
                    <p className="mt-1 text-[#718096]">
                      {task.roomTypeName}, поверх {task.floor}
                    </p>
                  </div>
                  <span className={`rounded-full bg-[#edf1f7] px-3 py-1 text-xs font-semibold text-[#2fb67d] ${insetShadow}`}>
                    {task.status}
                  </span>
                </div>

                <div className="mt-6 space-y-3 text-sm text-[#718096]">
                  <div className={`rounded-2xl bg-[#edf1f7] p-3 ${insetShadow}`}>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#718096]">Створено</span>
                    <span className="mt-1 block font-semibold text-[#2d3748]">{formatDateTime(task.createdAt)}</span>
                  </div>
                  <div className={`rounded-2xl bg-[#edf1f7] p-3 ${insetShadow}`}>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#718096]">ID кімнати</span>
                    <span className="mt-1 block break-all font-semibold text-[#2d3748]">{task.roomId}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleComplete(task.id)}
                  className={`mt-6 w-full rounded-2xl bg-[#2fb67d] px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-[#8fd8ba] ${successButtonShadow}`}
                >
                  {isBusy ? 'Завершення...' : 'Прибирання завершено'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

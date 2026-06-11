import { apiClient } from '../../lib/axios';
import type { CleaningTaskDto } from '../../types/housekeeping';

export const getPendingCleaningTasks = async (): Promise<CleaningTaskDto[]> => {
  const response = await apiClient.get('/cleaningtask/pending');
  return response.data;
};

export const completeCleaningTask = async (taskId: string): Promise<void> => {
  await apiClient.put(`/cleaningtask/${taskId}/complete`);
};

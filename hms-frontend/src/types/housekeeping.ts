export interface CleaningTaskDto {
  id: string;
  status: string;
  createdAt: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  roomTypeName: string;
  assignedMaidId: string | null;
}

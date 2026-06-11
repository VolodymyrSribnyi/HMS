export interface FinancialReportDto {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalPaymentsCount: number;
}

export interface OperationalReportDto {
  reportDate: string;
  totalRooms: number;
  occupiedRooms: number;
  needsCleaningRooms: number;
  expectedCheckInsToday: number;
  expectedCheckOutsToday: number;
}

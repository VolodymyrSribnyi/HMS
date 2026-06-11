import { apiClient } from '../../lib/axios';
import type { FinancialReportDto, OperationalReportDto } from '../../types/report';

type RawFinancialReport = Partial<FinancialReportDto> & {
  StartDate?: string;
  EndDate?: string;
  TotalRevenue?: number;
  TotalPaymentsCount?: number;
};

type RawOperationalReport = Partial<OperationalReportDto> & {
  ReportDate?: string;
  TotalRooms?: number;
  OccupiedRooms?: number;
  NeedsCleaningRooms?: number;
  ExpectedCheckInsToday?: number;
  ExpectedCheckOutsToday?: number;
};

const unwrapResponse = (data: unknown): unknown => {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value?: unknown }).value;
  }

  return data;
};

const mapFinancialReport = (report: RawFinancialReport): FinancialReportDto => ({
  startDate: report.startDate ?? report.StartDate ?? '',
  endDate: report.endDate ?? report.EndDate ?? '',
  totalRevenue: report.totalRevenue ?? report.TotalRevenue ?? 0,
  totalPaymentsCount: report.totalPaymentsCount ?? report.TotalPaymentsCount ?? 0,
});

const mapOperationalReport = (report: RawOperationalReport): OperationalReportDto => ({
  reportDate: report.reportDate ?? report.ReportDate ?? '',
  totalRooms: report.totalRooms ?? report.TotalRooms ?? 0,
  occupiedRooms: report.occupiedRooms ?? report.OccupiedRooms ?? 0,
  needsCleaningRooms: report.needsCleaningRooms ?? report.NeedsCleaningRooms ?? 0,
  expectedCheckInsToday: report.expectedCheckInsToday ?? report.ExpectedCheckInsToday ?? 0,
  expectedCheckOutsToday: report.expectedCheckOutsToday ?? report.ExpectedCheckOutsToday ?? 0,
});

export const getFinancialReport = async (
  startDate: string,
  endDate: string,
): Promise<FinancialReportDto> => {
  const response = await apiClient.get('/reports/financial', {
    params: { startDate, endDate },
  });

  return mapFinancialReport(unwrapResponse(response.data) as RawFinancialReport);
};

export const getOperationalReport = async (date?: string): Promise<OperationalReportDto> => {
  const response = await apiClient.get('/reports/operational', {
    params: date ? { date } : undefined,
  });

  return mapOperationalReport(unwrapResponse(response.data) as RawOperationalReport);
};

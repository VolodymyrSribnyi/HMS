import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { FinancialReportDto, OperationalReportDto } from '../../types/report';
import { getFinancialReport, getOperationalReport } from './reportsApi';

const panelShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]';
const floatingShadow = 'shadow-[12px_12px_24px_rgba(163,177,198,0.35),-12px_-12px_24px_rgba(255,255,255,0.8)]';
const insetShadow = 'shadow-[inset_6px_6px_12px_rgba(163,177,198,0.35),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]';
const buttonShadow = 'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]';

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
  const today = new Date();
  return toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
};

const getToday = () => toDateInputValue(new Date());

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 2,
  }).format(value);

const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }

  return undefined;
};

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

const MetricCard = ({ label, value, hint }: MetricCardProps) => (
  <div className={`rounded-3xl bg-[#edf1f7] p-6 ${floatingShadow}`}>
    <p className="text-sm font-semibold text-[#718096]">{label}</p>
    <p className="mt-3 text-3xl font-bold text-[#4f7cff]">{value}</p>
    {hint && <p className="mt-2 text-sm text-[#718096]">{hint}</p>}
  </div>
);

export const ReportsDashboardPage = () => {
  const [operationalReport, setOperationalReport] = useState<OperationalReportDto | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReportDto | null>(null);
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getToday);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinancialLoading, setIsFinancialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const [operational, financial] = await Promise.all([
          getOperationalReport(getToday()),
          getFinancialReport(getMonthStart(), getToday()),
        ]);

        setOperationalReport(operational);
        setFinancialReport(financial);
      } catch (requestError: unknown) {
        setError(getApiError(requestError) ?? 'Не вдалося завантажити звіти.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, []);

  const operationalMetrics = useMemo(
    () => [
      {
        label: 'Total Rooms',
        value: operationalReport?.totalRooms ?? 0,
        hint: 'Усього номерів у фонді',
      },
      {
        label: 'Occupied Rooms',
        value: operationalReport?.occupiedRooms ?? 0,
        hint: 'Наразі зайняті',
      },
      {
        label: 'Needs Cleaning',
        value: operationalReport?.needsCleaningRooms ?? 0,
        hint: 'Потребують прибирання',
      },
      {
        label: 'Expected Check-ins',
        value: operationalReport?.expectedCheckInsToday ?? 0,
        hint: 'Очікувані заїзди',
      },
      {
        label: 'Expected Check-outs',
        value: operationalReport?.expectedCheckOutsToday ?? 0,
        hint: 'Очікувані виїзди',
      },
    ],
    [operationalReport],
  );

  const handleFinancialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setIsFinancialLoading(true);
      const report = await getFinancialReport(startDate, endDate);
      setFinancialReport(report);
    } catch (requestError: unknown) {
      setError(getApiError(requestError) ?? 'Не вдалося сформувати фінансовий звіт.');
    } finally {
      setIsFinancialLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#e8ecf2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8dfeb] border-t-[#4f7cff]" />
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-8 bg-[#e8ecf2] text-[#2d3748]">
      <div>
        <h1 className="text-3xl font-bold">Звітність</h1>
        <p className="mt-2 text-[#718096]">Операційні та фінансові показники готелю.</p>
      </div>

      {error && (
        <div className={`rounded-3xl bg-[#f7e4e4] p-4 font-medium text-[#e45858] ${insetShadow}`}>
          {error}
        </div>
      )}

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Операційне зведення</h2>
          <p className="mt-1 text-sm text-[#718096]">Показники на сьогодні.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          {operationalMetrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
          ))}
        </div>
      </section>

      <section className={`rounded-3xl bg-[#edf1f7] p-6 ${panelShadow}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Фінансовий звіт</h2>
          <p className="mt-1 text-sm text-[#718096]">За замовчуванням показано поточний місяць.</p>
        </div>

        <form onSubmit={handleFinancialSubmit} className="mb-6 grid grid-cols-1 gap-4 rounded-3xl bg-[#edf1f7] p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-[#718096]">Початок періоду</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={`w-full rounded-[18px] bg-[#edf1f7] px-4 py-3 text-[#2d3748] outline-none transition-all duration-200 focus:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.3),inset_-5px_-5px_10px_rgba(255,255,255,0.9),0_0_0_3px_rgba(79,124,255,0.18)] ${insetShadow}`}
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-[#718096]">Кінець періоду</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={`w-full rounded-[18px] bg-[#edf1f7] px-4 py-3 text-[#2d3748] outline-none transition-all duration-200 focus:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.3),inset_-5px_-5px_10px_rgba(255,255,255,0.9),0_0_0_3px_rgba(79,124,255,0.18)] ${insetShadow}`}
            />
          </label>

          <button
            type="submit"
            disabled={isFinancialLoading}
            className={`rounded-2xl bg-[#4f7cff] px-6 py-3 font-semibold text-[#f1f4f9] transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-[#9bb4ff] ${buttonShadow}`}
          >
            {isFinancialLoading ? 'Формування...' : 'Сформувати'}
          </button>
        </form>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(financialReport?.totalRevenue ?? 0)}
            hint="Сума отриманих платежів"
          />
          <MetricCard
            label="Total Payments Count"
            value={financialReport?.totalPaymentsCount ?? 0}
            hint="Кількість зареєстрованих оплат"
          />
        </div>
      </section>
    </div>
  );
};

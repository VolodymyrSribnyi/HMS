using Application.Common.Interfaces;
using Application.DTOs.Reports;
using Application.ErrorHandling;
using Application.Reports.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reports.QueryHandlers
{
    public class GetFinancialReportQueryHandler : IRequestHandler<GetFinancialReportQuery, Result<FinancialReportDto>>
    {
        private readonly IHmsDbContext _context;

        public GetFinancialReportQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<FinancialReportDto>> Handle(GetFinancialReportQuery request, CancellationToken cancellationToken)
        {
            var startDate = request.StartDate.Date;
            var endDateExclusive = request.EndDate.Date.AddDays(1);

            if (startDate >= endDateExclusive)
            {
                return Result<FinancialReportDto>.Failure(Errors.InvalidData);
            }

            var paymentSummary = await _context.Payments
                .AsNoTracking()
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDateExclusive)
                .GroupBy(_ => 1)
                .Select(group => new
                {
                    TotalRevenue = group.Sum(p => p.Amount),
                    TotalPaymentsCount = group.Count()
                })
                .FirstOrDefaultAsync(cancellationToken);

            var report = new FinancialReportDto
            {
                StartDate = startDate,
                EndDate = request.EndDate.Date,
                TotalRevenue = paymentSummary?.TotalRevenue ?? 0,
                TotalPaymentsCount = paymentSummary?.TotalPaymentsCount ?? 0
            };

            return Result<FinancialReportDto>.Success(report);
        }
    }
}

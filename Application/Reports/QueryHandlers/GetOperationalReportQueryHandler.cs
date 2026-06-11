using Application.Common.Interfaces;
using Application.DTOs.Reports;
using Application.ErrorHandling;
using Application.Reports.Queries;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reports.QueryHandlers
{
    public class GetOperationalReportQueryHandler : IRequestHandler<GetOperationalReportQuery, Result<OperationalReportDto>>
    {
        private readonly IHmsDbContext _context;

        public GetOperationalReportQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<OperationalReportDto>> Handle(GetOperationalReportQuery request, CancellationToken cancellationToken)
        {
            var targetDate = request.Date?.Date ?? DateTime.UtcNow.Date;

            var roomStatusCounts = await _context.Rooms
                .AsNoTracking()
                .GroupBy(room => room.Status)
                .Select(group => new
                {
                    Status = group.Key,
                    Count = group.Count()
                })
                .ToListAsync(cancellationToken);

            var expectedCheckIns = await _context.Bookings
                .AsNoTracking()
                .CountAsync(
                    b => b.CheckInDate.Date == targetDate &&
                        (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed),
                    cancellationToken);

            var expectedCheckOuts = await _context.Bookings
                .AsNoTracking()
                .CountAsync(
                    b => b.CheckOutDate.Date == targetDate && b.Status == BookingStatus.CheckedIn,
                    cancellationToken);

            var report = new OperationalReportDto
            {
                ReportDate = targetDate,
                TotalRooms = roomStatusCounts.Sum(item => item.Count),
                OccupiedRooms = roomStatusCounts.FirstOrDefault(item => item.Status == RoomStatus.Occupied)?.Count ?? 0,
                NeedsCleaningRooms = roomStatusCounts.FirstOrDefault(item => item.Status == RoomStatus.NeedsCleaning)?.Count ?? 0,
                ExpectedCheckInsToday = expectedCheckIns,
                ExpectedCheckOutsToday = expectedCheckOuts
            };

            return Result<OperationalReportDto>.Success(report);
        }
    }
}

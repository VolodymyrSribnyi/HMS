using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Reports
{
    public class FinancialReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalPaymentsCount { get; set; }
        // Можна додати розбивку по днях або типах оплат, якщо потрібно
    }
}

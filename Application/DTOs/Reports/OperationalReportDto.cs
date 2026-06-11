using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Reports
{
    public class OperationalReportDto
    {
        public DateTime ReportDate { get; set; }
        public int TotalRooms { get; set; }
        public int OccupiedRooms { get; set; }
        public int NeedsCleaningRooms { get; set; }
        public int ExpectedCheckInsToday { get; set; }
        public int ExpectedCheckOutsToday { get; set; }
    }
}

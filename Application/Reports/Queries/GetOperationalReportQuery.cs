using Application.DTOs.Reports;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Reports.Queries
{
    public record GetOperationalReportQuery(DateTime? Date = null) : IRequest<Result<OperationalReportDto>>;

}

using System;
using System.Collections.Generic;
using System.Text;

namespace Application.ErrorHandling
{
    public sealed record Error(string Code, string Description)
    {
        public static readonly Error None = new(string.Empty, string.Empty);
    }
}

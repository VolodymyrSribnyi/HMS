using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Authentication.Commands
{
    public record RefreshTokenCommand : IRequest<Result<TokenResponse>>
    {
        public string RefreshToken { get; set; }
    }
}

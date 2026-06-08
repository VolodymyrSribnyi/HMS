using Application.DTOs.User;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Authentication.Commands
{
    public record AuthUserCommand : IRequest<Result<AuthResponseDTO>>
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}

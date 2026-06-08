using Application.Authentication.Commands;
using Application.Common.Interfaces;
using Application.DTOs.User;
using Application.ErrorHandling;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Authentication.CommandHandlers
{
    public class AuthUserCommandHandler : IRequestHandler<AuthUserCommand,Result<AuthResponseDTO>>
    {
        private readonly IIdentityService _identityService;

        public AuthUserCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<Result<AuthResponseDTO>> Handle(AuthUserCommand request, CancellationToken cancellationToken)
        {
            var authResult = await _identityService.AuthenticateAsync(request.Email, request.Password);

            if (!authResult.IsSuccess)
            {
                return Result<AuthResponseDTO>.Failure(Errors.AuthFailed);
            }

            // 2. Повертаємо результат
            return Result<AuthResponseDTO>.Success(authResult.Value);
        }
    }
}

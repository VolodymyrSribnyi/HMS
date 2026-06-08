using Application.Authentication.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Authentication.CommandHandlers
{
    public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand,Result<TokenResponse>>
    {
        private readonly IIdentityService _identityService;
        public RefreshTokenCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }
        async Task<Result<TokenResponse>> IRequestHandler<RefreshTokenCommand, Result<TokenResponse>>.Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            return await _identityService.GetRefreshTokenAsync(request.RefreshToken, cancellationToken);
        }
    }
}

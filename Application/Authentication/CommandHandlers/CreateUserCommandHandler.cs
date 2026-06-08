using Application.Authentication.Commands;
using Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Security.Principal;
using System.Text;

namespace Application.Authentication.CommandHandlers
{
    public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, string>
    {
        private readonly IIdentityService _identityService;
        public CreateUserCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<string> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            var result = await _identityService.CreateUserAsync(request.FirstName, request.LastName, request.UserName, request.Email, request.Password);

            if (!result.Result.IsSuccess)
            {
                throw new Exception($"Unable to create {request.UserName}. Error: {result.Result.Error.Description}");
            }

            var addUserToRoleResult = await _identityService.AddToRolesAsync(result.UserId, request.Roles);

            if (!addUserToRoleResult.IsSuccess)
            {
                throw new Exception($"Unable to add {request.UserName} to roles. Error: {addUserToRoleResult.Error.Description}");
            }

            return result.UserId.ToString();
        }
    }
}


using Application.Authentication.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using MediatR;

namespace Application.Authentication.CommandHandlers
{
    public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<string>>
    {
        private readonly IIdentityService _identityService;

        public CreateUserCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<Result<string>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            var result = await _identityService.CreateUserAsync(
                request.FirstName!,
                request.LastName!,
                request.UserName!,
                request.Email!,
                request.Password!);

            if (!result.Result.IsSuccess)
            {
                return Result<string>.Failure(result.Result.Error);
            }

            var addUserToRoleResult = await _identityService.AddToRolesAsync(result.UserId, request.Roles!);

            if (!addUserToRoleResult.IsSuccess)
            {
                return Result<string>.Failure(addUserToRoleResult.Error);
            }

            return Result<string>.Success(result.UserId.ToString());
        }
    }
}

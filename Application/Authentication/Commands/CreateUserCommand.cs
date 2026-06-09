using Application.ErrorHandling;
using MediatR;

namespace Application.Authentication.Commands
{
    public record CreateUserCommand : IRequest<Result<string>>
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? UserName { get; set; }
        public string? Password { get; set; }
        public string? Email { get; set; }
        public List<string>? Roles { get; set; } = new List<string> { "Guest" };
    }
}

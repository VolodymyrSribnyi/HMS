using Application.Common.Behavior;
using Application.Mappers;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            var assembly = typeof(DependencyInjection).Assembly;
            var validatorTypes = assembly.GetTypes()
                .Where(type => !type.IsAbstract && !type.IsInterface)
                .Select(type => new
                {
                    Implementation = type,
                    ValidatorInterface = type.GetInterfaces()
                        .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IValidator<>))
                })
                .Where(type => type.ValidatorInterface is not null);

            foreach (var validatorType in validatorTypes)
            {
                services.AddTransient(validatorType.ValidatorInterface!, validatorType.Implementation);
            }

            services.AddAutoMapper(cfg => cfg.AddProfile<RoomTypeMapperProfile>());
            return services;
        }
    }
}

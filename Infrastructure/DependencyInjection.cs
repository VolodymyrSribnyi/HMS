using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Infrastructure.Data.Interceptors;
using Infrastructure.Identity;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using System.Reflection;

namespace Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<BookingHistoryInterceptor>();

            services.AddDbContext<HmsDbContext>((sp, options) =>
                options
                    .UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
                    .AddInterceptors(sp.GetRequiredService<BookingHistoryInterceptor>()));

            services.AddScoped<IHmsDbContext>(provider => provider.GetRequiredService<HmsDbContext>());

            services.AddIdentity<ApplicationUser, IdentityRole<Guid>>()
                .AddEntityFrameworkStores<HmsDbContext>()
                .AddDefaultTokenProviders();

            services.AddScoped<IIdentityService, IdentityService>();
            services.AddScoped<IJwtUtils, JwtUtils>();
            services.AddScoped<IRoomTypeRepository,RoomTypeRepository>();
            services.AddScoped<IBookingRepository,BookingRepository>();


            return services;
        }

    }
}

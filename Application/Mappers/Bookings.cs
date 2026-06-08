using Application.DTOs.Booking;
using AutoMapper;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Mappers
{
    public class Bookings : Profile
    {
        public Bookings()
        {
            CreateMap<Booking, GetBookingDTO>()
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.AssignedRoom.RoomType.Name))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}

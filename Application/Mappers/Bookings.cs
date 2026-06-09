using Application.DTOs.Booking;
using AutoMapper;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Mappers
{
    public class BookingMapperProfile : Profile
    {
        public BookingMapperProfile()
        {
            CreateMap<Booking, GetBookingDTO>()
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RoomType.Name));
        }
    }
}

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
                           opt => opt.MapFrom(src => src.RoomType.Name))
                .ForMember(dest => dest.AssignedRoomNumber,
                           opt => opt.MapFrom(src => src.AssignedRoom != null ? src.AssignedRoom.RoomNumber : null))
                .ForMember(dest => dest.GuestFullName,
                           opt => opt.MapFrom(src => src.Guest != null ? $"{src.Guest.FirstName} {src.Guest.LastName}" : null));
        }
    }
}

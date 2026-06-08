using Application.DTOs.RoomType;
using AutoMapper;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Mappers
{
    public class RoomTypeMapperProfile : Profile
    {
        public RoomTypeMapperProfile()
        {
            CreateMap<RoomType, GetRoomTypeDTO>();
            CreateMap<GetRoomTypeDTO, RoomType>();
        }
    }
}

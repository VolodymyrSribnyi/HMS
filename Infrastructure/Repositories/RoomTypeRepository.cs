using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class RoomTypeRepository : IRoomTypeRepository
    {
        private readonly HmsDbContext _dbContext;
        public RoomTypeRepository(HmsDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        
    }
}

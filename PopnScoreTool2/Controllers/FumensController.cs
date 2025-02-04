﻿using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PopnScoreTool2.Data;

namespace PopnScoreTool2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FumensController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FumensController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Values
        [HttpGet]
        public async Task<ActionResult<object[]>> GetValues()
        {
            var item = await _context.Musics.Where(w => w.Deleted == false)
                .Select(a => new object[]{ a.Id, a.Name, a.Genre + (a.Position == 1 ? "UPPER": ""), a.LevelId, a.Level,
                    a.Version })
                .ToArrayAsync();

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }
    }
}

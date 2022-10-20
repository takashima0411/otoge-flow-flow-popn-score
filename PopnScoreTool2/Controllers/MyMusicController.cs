using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PopnScoreTool2.Data;

namespace PopnScoreTool2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MyMusicController : AuthedController
    {
        public MyMusicController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Values
        [HttpGet]
        public Task<ActionResult<object[][]>> GetValues()
        {
            return authenticated(async id => await query(id));
        }

        private Task<object[][]> query(int userIntId)
        {
            return _context.Musics.Where(w => w.Deleted == false)
                .GroupJoin(_context.MusicScores.Where(w => w.UserIntId == userIntId), a => a.Id, b => b.FumenId, (a, b) => new { a, b })
                .SelectMany(ab => ab.b.DefaultIfEmpty(), (a, b) => new
                {
                    a.a.Id,
                    MedalOrdinalScale = b == null ? -2 : b.MedalOrdinalScale,
                    RankOrdinalScale = b == null ? -2 : b.RankOrdinalScale,
                    Score = b == null ? -2 : b.Score
                }).Select(a => new object[] { a.Id, a.MedalOrdinalScale, a.RankOrdinalScale, a.Score })
                // }).Select(a => new object[] { a.Id, a.MedalOrdinalScale })
                .ToArrayAsync();
        }
    }
}

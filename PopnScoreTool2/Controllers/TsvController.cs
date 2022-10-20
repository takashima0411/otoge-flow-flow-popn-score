﻿using System;
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
    public class TsvController : AuthedController
    {
        public TsvController(AppDbContext context)
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
                .GroupJoin(_context.MusicScores.Where(b => b.UserIntId == userIntId), a => a.Id, b => b.FumenId, (a, b) => new { a, b })
                .SelectMany(ab => ab.b.DefaultIfEmpty(), (c, d) => new
                {
                    c.a.Name,
                    c.a.Genre,
                    c.a.Position,
                    c.a.LevelId,
                    c.a.Level,
                    MedalOrdinalScale = d == null ? -2 : d.MedalOrdinalScale,
                    RankOrdinalScale = d == null ? -2 : d.RankOrdinalScale,
                    Score = d == null ? -2 : d.Score,
                    c.a.Version
                })
                .Select(a => new object[]{ a.Name, a.Genre + (a.Position == 1 ? "UPPER": ""), a.LevelId, a.Level,
                    a.MedalOrdinalScale, a.RankOrdinalScale, a.Score, a.Version })
                .ToArrayAsync();
        }

    }
}

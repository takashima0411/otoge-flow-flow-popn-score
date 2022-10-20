using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PopnScoreTool2.Data;
using PopnScoreTool2.Models;

namespace PopnScoreTool2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : AuthedController
    {
        public ProfileController(AppDbContext context)
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
            return _context.Profiles
                .Where(a => a.UserIntId == userIntId)
                .Select(a => new object[]{ a.PlayerName, a.PopnFrendId, a.UseCharacterName,
                    a.NormalModeCreditCount, a.BattleModeCreditCount, a.LocalModeCreditCount, a.Comment, a.LastUpdateTime.ToString("yyyy/MM/dd HH:mm:ss") })
                .ToArrayAsync();
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using PopnScoreTool2.Data;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PopnScoreTool2.Controllers
{
    public abstract  class AuthedController : ControllerBase
    {
        protected AppDbContext _context;

        protected async Task<ActionResult<object[][]>> authenticated(Func<int, Task<object[][]>> func)
        {
            try
            {
                // ログインしているか確認。
                if (!User.Identity.IsAuthenticated)
                {
                    return NotFound();
                }

                // IDを特定する
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // UserIntID取得。なければ終わり
                var userInt = _context.UserInts.Where(a => a.AspNetUsersFK == userId);

                if (!userInt.Any())
                {
                    return NotFound();
                }

                int userIntId = userInt.First().Id;
                return await func(userIntId);
            }
            catch(NullReferenceException _)
            {
                return NotFound();
            }
        }
    }
}

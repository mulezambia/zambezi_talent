using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Data;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TalentController : ControllerBase
{
    private readonly AppDbContext _context;
    public TalentController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var talents = await _context.Users
            .Where(u => u.Role == "Talent")
            .Select(u => new { u.Id, u.FullName, u.Email, u.Sport, u.Position, u.Province })
            .ToListAsync();
        return Ok(talents);
    }
}
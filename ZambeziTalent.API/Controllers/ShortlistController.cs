using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Data;
using ZambeziTalent.API.Models;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShortlistController : ControllerBase
{
    private readonly AppDbContext _context;
    public ShortlistController(AppDbContext context) => _context = context;

    [HttpGet("{scoutEmail}")]
    public async Task<IActionResult> Get(string scoutEmail)
    {
        var list = await _context.Shortlists.Where(s => s.ScoutEmail == scoutEmail).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Add(Shortlist item)
    {
        var exists = await _context.Shortlists.FirstOrDefaultAsync(s => s.ScoutEmail == item.ScoutEmail && s.TalentId == item.TalentId);
        if (exists != null) { _context.Shortlists.Remove(exists); await _context.SaveChangesAsync(); return Ok(new { shortlisted = false }); }
        _context.Shortlists.Add(item);
        await _context.SaveChangesAsync();
        return Ok(new { shortlisted = true });
    }
}
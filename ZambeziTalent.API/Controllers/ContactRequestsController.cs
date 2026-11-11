using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Data;
using ZambeziTalent.API.Models;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ContactRequestsController(AppDbContext db) { _db = db; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.ScoutEmail) || string.IsNullOrWhiteSpace(req.TalentEmail))
                return BadRequest("ScoutEmail and TalentEmail are required");

            var scoutEmail = req.ScoutEmail.Trim().ToLower();
            var talentEmail = req.TalentEmail.Trim().ToLower();

            var existing = await _db.ContactRequests
                .FirstOrDefaultAsync(x =>
                    (x.ScoutEmail ?? "").ToLower() == scoutEmail &&
                    (x.TalentEmail ?? "").ToLower() == talentEmail &&
                    x.Status == "Pending");

            if (existing != null) return Ok(existing);

            req.ScoutEmail = req.ScoutEmail.Trim();
            req.TalentEmail = req.TalentEmail.Trim();
            req.Status = "Pending";
            req.CreatedAt = DateTime.UtcNow;
            _db.ContactRequests.Add(req);
            await _db.SaveChangesAsync();
            return Ok(req);
        }
        catch (Exception ex)
        {
            // This will show the REAL error in backend terminal
            Console.WriteLine("CREATE ERROR: " + ex.ToString());
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("for-talent")]
    public async Task<IActionResult> ForTalent([FromQuery] string? email)
    {
        if (string.IsNullOrEmpty(email)) return Ok(new List<ContactRequest>());
        try
        {
            var e = email.Trim().ToLower();
            var list = await _db.ContactRequests
                .Where(x => (x.TalentEmail ?? "").ToLower() == e)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            Console.WriteLine("FOR-TALENT ERROR: " + ex.ToString());
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("for-scout")]
    public async Task<IActionResult> ForScout([FromQuery] string? email)
    {
        if (string.IsNullOrEmpty(email)) return Ok(new List<ContactRequest>());
        try
        {
            var e = email.Trim().ToLower();
            var list = await _db.ContactRequests
                .Where(x => (x.ScoutEmail ?? "").ToLower() == e)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            Console.WriteLine("FOR-SCOUT ERROR: " + ex.ToString());
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{id}/respond")]
    public async Task<IActionResult> Respond(int id, [FromBody] string status)
    {
        var req = await _db.ContactRequests.FindAsync(id);
        if (req == null) return NotFound();
        var normalized = (status ?? "").Trim().ToLower() == "accepted" ? "Accepted" : "Declined";
        req.Status = normalized;
        await _db.SaveChangesAsync();
        return Ok(req);
    }
}
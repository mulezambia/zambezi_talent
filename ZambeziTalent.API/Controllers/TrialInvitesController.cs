using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Data;
using ZambeziTalent.API.Models;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrialInvitesController : ControllerBase
{
    private readonly AppDbContext _db;
    public TrialInvitesController(AppDbContext db) { _db = db; }

    // Scout sends trial invite
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TrialInvite invite)
    {
        if (string.IsNullOrWhiteSpace(invite.ScoutEmail) || string.IsNullOrWhiteSpace(invite.TalentEmail))
            return BadRequest("Emails required");

        // Only allow trial if contact was Accepted
        var contactAccepted = await _db.ContactRequests.AnyAsync(x =>
            (x.ScoutEmail ?? "").ToLower() == invite.ScoutEmail.ToLower() &&
            (x.TalentEmail ?? "").ToLower() == invite.TalentEmail.ToLower() &&
            x.Status == "Accepted");
        if (!contactAccepted) return BadRequest("Contact must be Accepted before sending trial");

        // Prevent duplicate pending trial for same pair + date
        var existing = await _db.TrialInvites.FirstOrDefaultAsync(x =>
            (x.ScoutEmail ?? "").ToLower() == invite.ScoutEmail.ToLower() &&
            (x.TalentEmail ?? "").ToLower() == invite.TalentEmail.ToLower() &&
            x.TrialDate == invite.TrialDate && x.Status == "Pending");
        if (existing != null) return Ok(existing);

        invite.Status = "Pending";
        invite.CreatedAt = DateTime.UtcNow;
        _db.TrialInvites.Add(invite);
        await _db.SaveChangesAsync();
        return Ok(invite);
    }

    [HttpGet("for-talent")]
    public async Task<IActionResult> ForTalent([FromQuery] string? email)
    {
        if (string.IsNullOrEmpty(email)) return Ok(new List<TrialInvite>());
        var e = email.Trim().ToLower();
        var list = await _db.TrialInvites.Where(x => (x.TalentEmail ?? "").ToLower() == e).OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpGet("for-scout")]
    public async Task<IActionResult> ForScout([FromQuery] string? email)
    {
        if (string.IsNullOrEmpty(email)) return Ok(new List<TrialInvite>());
        var e = email.Trim().ToLower();
        var list = await _db.TrialInvites.Where(x => (x.ScoutEmail ?? "").ToLower() == e).OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost("{id}/respond")]
    public async Task<IActionResult> Respond(int id, [FromBody] string status)
    {
        var inv = await _db.TrialInvites.FindAsync(id);
        if (inv == null) return NotFound();
        inv.Status = (status ?? "").Trim().ToLower() == "accepted" ? "Accepted" : "Declined";
        await _db.SaveChangesAsync();
        return Ok(inv);
    }
}
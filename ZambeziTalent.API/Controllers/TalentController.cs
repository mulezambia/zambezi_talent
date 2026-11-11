using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize(Roles = "Talent")]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateTalentDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("Invalid token");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found");

        // Only update fields that were sent
        if (dto.Sport != null) user.Sport = dto.Sport;
        if (dto.Position != null) user.Position = dto.Position;
        if (dto.Province != null) user.Province = dto.Province;

        await _context.SaveChangesAsync();

        return Ok(new { user.Id, user.FullName, user.Email, user.Sport, user.Position, user.Province });
    }
}

public class UpdateTalentDto
{
    public string? Sport { get; set; }
    public string? Position { get; set; }
    public string? Province { get; set; }
}
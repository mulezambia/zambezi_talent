using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Data;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Select(u => new {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.Position,
                u.Province,
                u.Sport,
                u.Bio,
                u.CreatedAt,
                u.IsVerified
            })
            .ToListAsync();
        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/verify")]
    public async Task<IActionResult> Verify(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");
        user.IsVerified = true;
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.FullName, user.Email, user.IsVerified });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/unverify")]
    public async Task<IActionResult> Unverify(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");
        user.IsVerified = false;
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.FullName, user.Email, user.IsVerified });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/make-admin")]
    public async Task<IActionResult> MakeAdmin(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");
        user.Role = "Admin";
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.FullName, user.Email, user.Role });
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ZambeziTalent.API.Data;
using ZambeziTalent.API.Dtos;

namespace ZambeziTalent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        // Validate required information.
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest("Please provide all required registration details.");
        }

        // Only Talent and Scout accounts may register publicly.
        // Admin accounts must be created through a protected process.
        var requestedRole = dto.Role.Trim();

        if (!requestedRole.Equals("Talent", StringComparison.OrdinalIgnoreCase) &&
            !requestedRole.Equals("Scout", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid account role. You may register as Talent or Scout only.");
        }

        // Store roles in a consistent format.
        var approvedRole = requestedRole.Equals(
            "Talent",
            StringComparison.OrdinalIgnoreCase
        ) ? "Talent" : "Scout";

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute()
            .IsValid(normalizedEmail))
        {
            return BadRequest("Please provide a valid email address.");
        }

        if (dto.Password.Length < 8)
        {
            return BadRequest("Your password must contain at least 8 characters.");
        }

        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest("Email already exists.");
        }

        var user = new Models.User
        {
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = approvedRole,
            Sport = dto.Sport,
            Position = dto.Position,
            Province = dto.Province
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Registered successfully",
            token = GenerateToken(user),
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.IsVerified
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == email
        );

        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(new
        {
            token = GenerateToken(user),
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.IsVerified
            }
        });
    }

    private string GenerateToken(Models.User user)
    {
        var jwtKey = _config["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "JWT signing key is not configured."
            );
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
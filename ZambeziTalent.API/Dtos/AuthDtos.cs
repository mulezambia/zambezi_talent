namespace ZambeziTalent.API.Dtos;

public record RegisterDto(string FullName, string Email, string Password, string Role, string? Sport, string? Position, string? Province);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(int Id, string FullName, string Email, string Role, string Token);
using Microsoft.EntityFrameworkCore;
using ZambeziTalent.API.Models;

namespace ZambeziTalent.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<User> Users => Set<User>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<Shortlist> Shortlists => Set<Shortlist>();
    public DbSet<TrialInvite> TrialInvites => Set<TrialInvite>();
}
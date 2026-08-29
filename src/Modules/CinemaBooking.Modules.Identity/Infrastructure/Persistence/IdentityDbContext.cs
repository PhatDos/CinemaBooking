using CinemaBooking.Modules.Identity.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IdentityDbContextBase = Microsoft.AspNetCore.Identity.EntityFrameworkCore.IdentityDbContext<CinemaBooking.Modules.Identity.Domain.ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<System.Guid>, System.Guid>;

namespace CinemaBooking.Modules.Identity.Infrastructure.Persistence;

public class IdentityDbContext : IdentityDbContextBase
{
    public IdentityDbContext(
        DbContextOptions<IdentityDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(
        ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("identity");

        builder.Entity<ApplicationUser>(user =>
        {
            user.Property(x => x.CreatedAt)
                .IsRequired();
        });

        builder.Entity<IdentityRole<Guid>>()
            .ToTable("AspNetRoles", "identity");
    }
}

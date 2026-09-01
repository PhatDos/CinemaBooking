using CinemaBooking.Modules.Identity.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CinemaBooking.Modules.Identity.Infrastructure.Persistence.Configurations;

public sealed class StaffCinemaAssignmentConfiguration
    : IEntityTypeConfiguration<StaffCinemaAssignment>
{
    public void Configure(
        EntityTypeBuilder<StaffCinemaAssignment> builder)
    {
        builder.ToTable("StaffCinemaAssignments", "identity");

        builder.HasKey(assignment => assignment.Id);

        builder.Property(assignment => assignment.CreatedAt)
            .IsRequired();

        builder.HasIndex(assignment => new
            {
                assignment.UserId,
                assignment.CinemaId
            })
            .IsUnique();

        builder.HasIndex(assignment => assignment.CinemaId);
    }
}

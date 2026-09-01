using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffCinemaAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StaffCinemaAssignments",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffCinemaAssignments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffCinemaAssignments_CinemaId",
                schema: "identity",
                table: "StaffCinemaAssignments",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffCinemaAssignments_UserId_CinemaId",
                schema: "identity",
                table: "StaffCinemaAssignments",
                columns: new[] { "UserId", "CinemaId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StaffCinemaAssignments",
                schema: "identity");
        }
    }
}

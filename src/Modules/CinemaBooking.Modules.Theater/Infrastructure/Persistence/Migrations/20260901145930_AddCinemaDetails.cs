using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCinemaDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Unknown");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "theater",
                table: "Cinemas",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cinemas_City",
                schema: "theater",
                table: "Cinemas",
                column: "City");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Cinemas_City",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "City",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "theater",
                table: "Cinemas");
        }
    }
}

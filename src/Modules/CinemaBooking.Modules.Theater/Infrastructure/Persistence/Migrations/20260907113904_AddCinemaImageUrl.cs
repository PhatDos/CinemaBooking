using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCinemaImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                schema: "theater",
                table: "Cinemas");
        }
    }
}

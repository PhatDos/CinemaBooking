using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomActiveAndSeatType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "theater",
                table: "Rooms",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                schema: "theater",
                table: "Seats",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "theater",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "Type",
                schema: "theater",
                table: "Seats");
        }
    }
}

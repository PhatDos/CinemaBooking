using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingHoldId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HoldId",
                schema: "booking",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_HoldId",
                schema: "booking",
                table: "Bookings",
                column: "HoldId",
                unique: true,
                filter: "[HoldId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_HoldId",
                schema: "booking",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HoldId",
                schema: "booking",
                table: "Bookings");
        }
    }
}

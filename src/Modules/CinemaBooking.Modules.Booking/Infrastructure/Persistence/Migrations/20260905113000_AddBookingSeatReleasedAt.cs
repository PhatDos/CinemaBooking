using System;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Booking.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(BookingDbContext))]
    [Migration("20260905113000_AddBookingSeatReleasedAt")]
    public partial class AddBookingSeatReleasedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReleasedAt",
                schema: "booking",
                table: "BookingSeats",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE seats
                SET ReleasedAt = SYSUTCDATETIME()
                FROM booking.BookingSeats AS seats
                INNER JOIN booking.Bookings AS bookings
                    ON bookings.Id = seats.BookingId
                WHERE bookings.Status IN (N'Expired', N'Cancelled')
                    AND seats.ReleasedAt IS NULL
                """);

            migrationBuilder.DropIndex(
                name: "IX_BookingSeats_ShowtimeId_SeatId",
                schema: "booking",
                table: "BookingSeats");

            migrationBuilder.CreateIndex(
                name: "IX_BookingSeats_ShowtimeId_SeatId",
                schema: "booking",
                table: "BookingSeats",
                columns: new[] { "ShowtimeId", "SeatId" },
                unique: true,
                filter: "[ReleasedAt] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BookingSeats_ShowtimeId_SeatId",
                schema: "booking",
                table: "BookingSeats");

            migrationBuilder.DropColumn(
                name: "ReleasedAt",
                schema: "booking",
                table: "BookingSeats");

            migrationBuilder.CreateIndex(
                name: "IX_BookingSeats_ShowtimeId_SeatId",
                schema: "booking",
                table: "BookingSeats",
                columns: new[] { "ShowtimeId", "SeatId" },
                unique: true);
        }
    }
}

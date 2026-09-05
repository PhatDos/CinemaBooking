using System;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(PaymentDbContext))]
    [Migration("20260905162000_AddHoldPaymentSnapshot")]
    public partial class AddHoldPaymentSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_BookingId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                schema: "payment",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                schema: "payment",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HoldId",
                schema: "payment",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ShowtimeId",
                schema: "payment",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PaymentSeats",
                schema: "payment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentSeats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentSeats_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalSchema: "payment",
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingId",
                schema: "payment",
                table: "Payments",
                column: "BookingId",
                unique: true,
                filter: "[BookingId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_HoldId",
                schema: "payment",
                table: "Payments",
                column: "HoldId",
                unique: true,
                filter: "[HoldId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentSeats_PaymentId_SeatId",
                schema: "payment",
                table: "PaymentSeats",
                columns: new[] { "PaymentId", "SeatId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentSeats",
                schema: "payment");

            migrationBuilder.DropIndex(
                name: "IX_Payments_BookingId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_HoldId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "HoldId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ShowtimeId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                schema: "payment",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: Guid.Empty,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingId",
                schema: "payment",
                table: "Payments",
                column: "BookingId",
                unique: true);
        }
    }
}

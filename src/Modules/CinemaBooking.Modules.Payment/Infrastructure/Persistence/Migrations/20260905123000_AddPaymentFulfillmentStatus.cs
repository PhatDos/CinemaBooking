using System;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(PaymentDbContext))]
    [Migration("20260905123000_AddPaymentFulfillmentStatus")]
    public partial class AddPaymentFulfillmentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FulfilledAt",
                schema: "payment",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FulfillmentFailedAt",
                schema: "payment",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FulfillmentLastError",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FulfillmentStatus",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FulfilledAt",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "FulfillmentFailedAt",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "FulfillmentLastError",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "FulfillmentStatus",
                schema: "payment",
                table: "Payments");
        }
    }
}

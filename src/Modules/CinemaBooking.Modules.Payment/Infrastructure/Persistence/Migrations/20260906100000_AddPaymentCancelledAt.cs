using System;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(PaymentDbContext))]
    [Migration("20260906100000_AddPaymentCancelledAt")]
    public partial class AddPaymentCancelledAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                schema: "payment",
                table: "Payments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledAt",
                schema: "payment",
                table: "Payments");
        }
    }
}

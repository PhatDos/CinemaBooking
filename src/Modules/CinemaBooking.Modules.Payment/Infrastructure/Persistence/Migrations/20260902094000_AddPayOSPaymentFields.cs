using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Payment.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayOSPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CheckoutUrl",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "OrderCode",
                schema: "payment",
                table: "Payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentLinkId",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "PayOS");

            migrationBuilder.AddColumn<string>(
                name: "ProviderTransactionId",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QrCode",
                schema: "payment",
                table: "Payments",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrderCode",
                schema: "payment",
                table: "Payments",
                column: "OrderCode",
                unique: true,
                filter: "[OrderCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_OrderCode",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CheckoutUrl",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentLinkId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Provider",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProviderTransactionId",
                schema: "payment",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "QrCode",
                schema: "payment",
                table: "Payments");
        }
    }
}

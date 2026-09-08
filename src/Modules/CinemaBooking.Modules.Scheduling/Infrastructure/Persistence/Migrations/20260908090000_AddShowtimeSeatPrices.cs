using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Scheduling.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShowtimeSeatPrices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "StandardPrice",
                schema: "scheduling",
                table: "Showtimes",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 90000m);

            migrationBuilder.AddColumn<decimal>(
                name: "VipPrice",
                schema: "scheduling",
                table: "Showtimes",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 100000m);

            migrationBuilder.AddColumn<decimal>(
                name: "CouplePrice",
                schema: "scheduling",
                table: "Showtimes",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 200000m);

            migrationBuilder.Sql(
                """
                UPDATE [scheduling].[Showtimes]
                SET [StandardPrice] = [BasePrice]
                WHERE [BasePrice] > 0
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StandardPrice",
                schema: "scheduling",
                table: "Showtimes");

            migrationBuilder.DropColumn(
                name: "VipPrice",
                schema: "scheduling",
                table: "Showtimes");

            migrationBuilder.DropColumn(
                name: "CouplePrice",
                schema: "scheduling",
                table: "Showtimes");
        }
    }
}

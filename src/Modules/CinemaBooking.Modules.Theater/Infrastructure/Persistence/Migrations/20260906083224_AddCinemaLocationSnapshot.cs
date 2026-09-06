using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Theater.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCinemaLocationSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvinceCode",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvinceName",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WardCode",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WardName",
                schema: "theater",
                table: "Cinemas",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cinemas_ProvinceCode",
                schema: "theater",
                table: "Cinemas",
                column: "ProvinceCode");

            migrationBuilder.CreateIndex(
                name: "IX_Cinemas_ProvinceCode_WardCode",
                schema: "theater",
                table: "Cinemas",
                columns: new[] { "ProvinceCode", "WardCode" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Cinemas_ProvinceCode",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropIndex(
                name: "IX_Cinemas_ProvinceCode_WardCode",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "AddressLine",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "ProvinceCode",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "ProvinceName",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "WardCode",
                schema: "theater",
                table: "Cinemas");

            migrationBuilder.DropColumn(
                name: "WardName",
                schema: "theater",
                table: "Cinemas");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "catalog",
                table: "Movies",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Genre",
                schema: "catalog",
                table: "Movies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "catalog",
                table: "Movies",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PosterUrl",
                schema: "catalog",
                table: "Movies",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrailerUrl",
                schema: "catalog",
                table: "Movies",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movies_IsActive",
                schema: "catalog",
                table: "Movies",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Movies_IsActive",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "Genre",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "PosterUrl",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "TrailerUrl",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "catalog",
                table: "Movies",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);
        }
    }
}

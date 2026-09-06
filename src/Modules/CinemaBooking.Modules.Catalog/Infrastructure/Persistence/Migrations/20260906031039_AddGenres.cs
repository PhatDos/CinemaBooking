using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGenres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GenreId",
                schema: "catalog",
                table: "Movies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Genres",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movies_GenreId",
                schema: "catalog",
                table: "Movies",
                column: "GenreId");

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Slug",
                schema: "catalog",
                table: "Genres",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Movies_Genres_GenreId",
                schema: "catalog",
                table: "Movies",
                column: "GenreId",
                principalSchema: "catalog",
                principalTable: "Genres",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movies_Genres_GenreId",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropTable(
                name: "Genres",
                schema: "catalog");

            migrationBuilder.DropIndex(
                name: "IX_Movies_GenreId",
                schema: "catalog",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "GenreId",
                schema: "catalog",
                table: "Movies");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieGenresAndImportDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GenreName",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.Sql("""
                UPDATE [catalog].[MovieImportCandidates]
                SET [Status] = 'Crawled'
                WHERE [Status] IN ('NewSuggested', 'UpdateSuggested');
                """);

            migrationBuilder.AddColumn<string>(
                name: "DetailError",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingGenres",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingTitle",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Popularity",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReleaseTimestamp",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MovieGenres",
                schema: "catalog",
                columns: table => new
                {
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GenreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieGenres", x => new { x.MovieId, x.GenreId });
                    table.ForeignKey(
                        name: "FK_MovieGenres_Genres_GenreId",
                        column: x => x.GenreId,
                        principalSchema: "catalog",
                        principalTable: "Genres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieGenres_Movies_MovieId",
                        column: x => x.MovieId,
                        principalSchema: "catalog",
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenres_GenreId",
                schema: "catalog",
                table: "MovieGenres",
                column: "GenreId");

            migrationBuilder.Sql("""
                INSERT INTO [catalog].[MovieGenres] ([MovieId], [GenreId], [CreatedAt])
                SELECT [m].[Id], [m].[GenreId], SYSUTCDATETIME()
                FROM [catalog].[Movies] AS [m]
                WHERE [m].[GenreId] IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM [catalog].[MovieGenres] AS [mg]
                      WHERE [mg].[MovieId] = [m].[Id]
                        AND [mg].[GenreId] = [m].[GenreId]
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieGenres",
                schema: "catalog");

            migrationBuilder.DropColumn(
                name: "DetailError",
                schema: "catalog",
                table: "MovieImportCandidates");

            migrationBuilder.DropColumn(
                name: "ListingGenres",
                schema: "catalog",
                table: "MovieImportCandidates");

            migrationBuilder.DropColumn(
                name: "ListingTitle",
                schema: "catalog",
                table: "MovieImportCandidates");

            migrationBuilder.DropColumn(
                name: "Popularity",
                schema: "catalog",
                table: "MovieImportCandidates");

            migrationBuilder.DropColumn(
                name: "ReleaseTimestamp",
                schema: "catalog",
                table: "MovieImportCandidates");

            migrationBuilder.AlterColumn<string>(
                name: "GenreName",
                schema: "catalog",
                table: "MovieImportCandidates",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}

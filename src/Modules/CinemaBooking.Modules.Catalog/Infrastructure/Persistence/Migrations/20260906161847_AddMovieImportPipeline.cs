using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBooking.Modules.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieImportPipeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovieExternalSources",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SourceUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieExternalSources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovieExternalSources_Movies_MovieId",
                        column: x => x.MovieId,
                        principalSchema: "catalog",
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieImportBatches",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieImportBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MovieImportCandidates",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SourceUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PosterUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TrailerUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    GenreName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MatchMovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Warnings = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieImportCandidates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovieImportCandidates_MovieImportBatches_BatchId",
                        column: x => x.BatchId,
                        principalSchema: "catalog",
                        principalTable: "MovieImportBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieImportCandidates_Movies_MatchMovieId",
                        column: x => x.MatchMovieId,
                        principalSchema: "catalog",
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieExternalSources_MovieId",
                schema: "catalog",
                table: "MovieExternalSources",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieExternalSources_Source_SourceUrl",
                schema: "catalog",
                table: "MovieExternalSources",
                columns: new[] { "Source", "SourceUrl" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieImportBatches_StartedAt",
                schema: "catalog",
                table: "MovieImportBatches",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MovieImportCandidates_BatchId",
                schema: "catalog",
                table: "MovieImportCandidates",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieImportCandidates_MatchMovieId",
                schema: "catalog",
                table: "MovieImportCandidates",
                column: "MatchMovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieImportCandidates_Source_SourceUrl_Status",
                schema: "catalog",
                table: "MovieImportCandidates",
                columns: new[] { "Source", "SourceUrl", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieExternalSources",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "MovieImportCandidates",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "MovieImportBatches",
                schema: "catalog");
        }
    }
}

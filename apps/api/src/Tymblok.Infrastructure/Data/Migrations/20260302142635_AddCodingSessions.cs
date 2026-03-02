using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCodingSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "coding_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActiveSeconds = table.Column<int>(type: "integer", nullable: false),
                    FilesEdited = table.Column<int>(type: "integer", nullable: false),
                    LinesAdded = table.Column<int>(type: "integer", nullable: false),
                    LinesRemoved = table.Column<int>(type: "integer", nullable: false),
                    Languages = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Commits = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coding_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_coding_sessions_time_blocks_BlockId",
                        column: x => x.BlockId,
                        principalTable: "time_blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_coding_sessions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coding_sessions_BlockId",
                table: "coding_sessions",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_coding_sessions_UserId_StartedAt",
                table: "coding_sessions",
                columns: new[] { "UserId", "StartedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coding_sessions");
        }
    }
}

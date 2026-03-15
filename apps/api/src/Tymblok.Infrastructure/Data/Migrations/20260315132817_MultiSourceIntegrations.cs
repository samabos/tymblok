using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MultiSourceIntegrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_integrations_UserId_Provider",
                table: "integrations");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "integrations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            // Backfill existing integrations with a default name based on provider + username
            migrationBuilder.Sql("""
                UPDATE integrations
                SET "Name" = CASE
                    WHEN "ExternalUsername" IS NOT NULL AND "ExternalUsername" != ''
                    THEN "Provider" || ' - ' || "ExternalUsername"
                    ELSE "Provider"
                END
                WHERE "Name" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_integrations_UserId_Provider",
                table: "integrations",
                columns: new[] { "UserId", "Provider" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_integrations_UserId_Provider",
                table: "integrations");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "integrations");

            migrationBuilder.CreateIndex(
                name: "IX_integrations_UserId_Provider",
                table: "integrations",
                columns: new[] { "UserId", "Provider" },
                unique: true);
        }
    }
}

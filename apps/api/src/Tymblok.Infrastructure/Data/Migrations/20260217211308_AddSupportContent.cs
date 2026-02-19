using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "support_content",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_content", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "support_content",
                columns: new[] { "Id", "Content", "ContentType", "CreatedAt", "DisplayOrder", "IsPublished", "Slug", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), "## Getting Started\n\n**How do I create a time block?**\nTap the + button on the Today screen, fill in the task details, and tap Save.\n\n**How do I start a timer?**\nTap the play button on any task card to start tracking time.\n\n**How do I connect integrations?**\nGo to Settings > Integrations and tap Connect on the service you want to sync.\n\n## Tasks\n\n**Can I reorder tasks?**\nYes! Long-press a task card and drag it to reorder.\n\n**What does the recurring icon mean?**\nTasks with the repeat icon are set to recur on a schedule.\n\n## Account\n\n**How do I change my password?**\nGo to Settings > Account > Change Password.\n\n**How do I delete my account?**\nContact support and we'll help you with account deletion.", "HelpFaq", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0, true, "help-faq", "Help & FAQ", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), "## Privacy Policy\n\n**Last updated:** February 2026\n\n### Information We Collect\n\nWe collect information you provide directly, such as your name, email address, and task data.\n\n### How We Use Your Information\n\nWe use your information to provide and improve Tymblok, including:\n- Managing your account and tasks\n- Syncing with third-party integrations you connect\n- Sending important service updates\n\n### Data Security\n\nWe use industry-standard encryption to protect your data in transit and at rest.\n\n### Third-Party Integrations\n\nWhen you connect integrations (GitHub, Google Calendar, etc.), we only access the data necessary to sync your tasks. We do not share your data with third parties for advertising.\n\n### Your Rights\n\nYou can request to export or delete your data at any time by contacting support.\n\n### Contact\n\nFor questions about this policy, email us at privacy@tymblok.com.", "PrivacyPolicy", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1, true, "privacy-policy", "Privacy Policy", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_support_content_Slug",
                table: "support_content",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "support_content");
        }
    }
}

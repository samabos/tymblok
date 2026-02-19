using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NotificationBlockReminder",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NotificationDailySummary",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "NotificationReminderMinutes",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificationBlockReminder",
                table: "users");

            migrationBuilder.DropColumn(
                name: "NotificationDailySummary",
                table: "users");

            migrationBuilder.DropColumn(
                name: "NotificationReminderMinutes",
                table: "users");
        }
    }
}

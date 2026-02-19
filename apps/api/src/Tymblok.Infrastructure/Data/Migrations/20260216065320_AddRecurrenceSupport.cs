using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrenceSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "time_blocks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "RecurrenceParentId",
                table: "time_blocks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecurrenceRuleId",
                table: "time_blocks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "recurrence_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Interval = table.Column<int>(type: "integer", nullable: false),
                    DaysOfWeek = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    MaxOccurrences = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recurrence_rules", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_time_blocks_RecurrenceRuleId",
                table: "time_blocks",
                column: "RecurrenceRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_recurrence_rules_Type",
                table: "recurrence_rules",
                column: "Type");

            migrationBuilder.AddForeignKey(
                name: "FK_time_blocks_recurrence_rules_RecurrenceRuleId",
                table: "time_blocks",
                column: "RecurrenceRuleId",
                principalTable: "recurrence_rules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_time_blocks_recurrence_rules_RecurrenceRuleId",
                table: "time_blocks");

            migrationBuilder.DropTable(
                name: "recurrence_rules");

            migrationBuilder.DropIndex(
                name: "IX_time_blocks_RecurrenceRuleId",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "RecurrenceParentId",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "RecurrenceRuleId",
                table: "time_blocks");
        }
    }
}

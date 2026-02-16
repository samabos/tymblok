using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrenceToInboxItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "inbox_items",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "RecurrenceRuleId",
                table: "inbox_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_inbox_items_RecurrenceRuleId",
                table: "inbox_items",
                column: "RecurrenceRuleId");

            migrationBuilder.AddForeignKey(
                name: "FK_inbox_items_recurrence_rules_RecurrenceRuleId",
                table: "inbox_items",
                column: "RecurrenceRuleId",
                principalTable: "recurrence_rules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inbox_items_recurrence_rules_RecurrenceRuleId",
                table: "inbox_items");

            migrationBuilder.DropIndex(
                name: "IX_inbox_items_RecurrenceRuleId",
                table: "inbox_items");

            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "inbox_items");

            migrationBuilder.DropColumn(
                name: "RecurrenceRuleId",
                table: "inbox_items");
        }
    }
}

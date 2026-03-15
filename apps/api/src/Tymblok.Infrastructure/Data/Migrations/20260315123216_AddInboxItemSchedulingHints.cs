using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxItemSchedulingHints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "inbox_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "inbox_items",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StartTime",
                table: "inbox_items",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_inbox_items_CategoryId",
                table: "inbox_items",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_inbox_items_categories_CategoryId",
                table: "inbox_items",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inbox_items_categories_CategoryId",
                table: "inbox_items");

            migrationBuilder.DropIndex(
                name: "IX_inbox_items_CategoryId",
                table: "inbox_items");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "inbox_items");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "inbox_items");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "inbox_items");
        }
    }
}

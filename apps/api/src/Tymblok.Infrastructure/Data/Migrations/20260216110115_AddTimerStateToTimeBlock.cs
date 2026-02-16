using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tymblok.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTimerStateToTimeBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PausedAt",
                table: "time_blocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResumedAt",
                table: "time_blocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "time_blocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimerState",
                table: "time_blocks",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PausedAt",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "ResumedAt",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "time_blocks");

            migrationBuilder.DropColumn(
                name: "TimerState",
                table: "time_blocks");
        }
    }
}

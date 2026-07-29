using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenSessionTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreviousRefreshTokenHash",
                table: "Pilots",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefreshTokenSessionStartedAtUtc",
                table: "Pilots",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_PreviousRefreshTokenHash",
                table: "Pilots",
                column: "PreviousRefreshTokenHash",
                filter: "\"PreviousRefreshTokenHash\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pilots_PreviousRefreshTokenHash",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "PreviousRefreshTokenHash",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "RefreshTokenSessionStartedAtUtc",
                table: "Pilots");
        }
    }
}

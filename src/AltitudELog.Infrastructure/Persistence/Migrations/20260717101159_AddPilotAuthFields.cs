using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPilotAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Pilots",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Pilots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_Username",
                table: "Pilots",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pilots_Username",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Pilots");
        }
    }
}

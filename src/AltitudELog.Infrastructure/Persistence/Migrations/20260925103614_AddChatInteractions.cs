using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChatInteractions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatInteractions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UnansweredQuestion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Language = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    Page = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsAnswered = table.Column<bool>(type: "boolean", nullable: false),
                    IsHelpful = table.Column<bool>(type: "boolean", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatInteractions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatInteractions_IsAnswered_CreatedAtUtc",
                table: "ChatInteractions",
                columns: new[] { "IsAnswered", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatInteractions");
        }
    }
}

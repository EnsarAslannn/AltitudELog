using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthLookupIndexesAndNormalizeCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "Pilots"
                SET "Username" = lower(btrim("Username")),
                    "Email" = CASE WHEN "Email" IS NULL THEN NULL ELSE lower(btrim("Email")) END
                WHERE "Username" <> lower(btrim("Username"))
                   OR ("Email" IS NOT NULL AND "Email" <> lower(btrim("Email")));
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_PasswordResetTokenHash",
                table: "Pilots",
                column: "PasswordResetTokenHash",
                filter: "\"PasswordResetTokenHash\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_RefreshTokenHash",
                table: "Pilots",
                column: "RefreshTokenHash",
                filter: "\"RefreshTokenHash\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_Date_Id",
                table: "Flights",
                columns: new[] { "Date", "Id" },
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pilots_PasswordResetTokenHash",
                table: "Pilots");

            migrationBuilder.DropIndex(
                name: "IX_Pilots_RefreshTokenHash",
                table: "Pilots");

            migrationBuilder.DropIndex(
                name: "IX_Flights_Date_Id",
                table: "Flights");
        }
    }
}

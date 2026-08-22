using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPilotConcurrencyTokenAndNormalizeLicenseNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "Pilots"
                        GROUP BY upper(btrim("LicenseNumber"))
                        HAVING count(*) > 1
                    ) THEN
                        RAISE EXCEPTION
                            'Cannot normalise Pilots.LicenseNumber: two or more rows differ only by case or surrounding whitespace, and the column is uniquely indexed. Resolve those duplicates by hand, then re-run this migration.';
                    END IF;
                END $$;

                UPDATE "Pilots"
                SET "LicenseNumber" = upper(btrim("LicenseNumber"))
                WHERE "LicenseNumber" <> upper(btrim("LicenseNumber"));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}

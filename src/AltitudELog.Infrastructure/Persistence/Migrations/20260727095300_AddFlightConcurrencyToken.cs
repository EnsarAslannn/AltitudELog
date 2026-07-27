using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightConcurrencyToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // "xmin" is Postgres's built-in system column, not an app-managed column — it
            // already exists on every table. This migration only registers it as a
            // concurrency token in EF's model (see FlightConfiguration); there is no schema
            // to create. Mirrors FormalizeNonClusteredIndexes' empty Up()/Down() precedent.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}

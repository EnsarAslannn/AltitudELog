using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditTrailAndCRMReportStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAtUtc",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancelledByPilotId",
                table: "Flights",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByPilotId",
                table: "Flights",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByPilotId",
                table: "Flights",
                type: "uuid",
                nullable: true);

            // Hand-edited: EF scaffolds defaultValue "" here, and an empty string maps to no
            // CRMReportStatus at all — every report filed before this migration would fail to
            // materialise on the next read. "Open" is the truthful backfill: a report nobody has
            // reviewed yet is exactly what Open means.
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CRMReports",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Open");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "CRMReports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByPilotId",
                table: "CRMReports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Crew",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByPilotId",
                table: "Crew",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Crew",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByPilotId",
                table: "Crew",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CRMReports_Status",
                table: "CRMReports",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CRMReports_Status",
                table: "CRMReports");

            migrationBuilder.DropColumn(
                name: "CancelledAtUtc",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "CancelledByPilotId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "CreatedByPilotId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "UpdatedByPilotId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CRMReports");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "CRMReports");

            migrationBuilder.DropColumn(
                name: "UpdatedByPilotId",
                table: "CRMReports");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Crew");

            migrationBuilder.DropColumn(
                name: "CreatedByPilotId",
                table: "Crew");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Crew");

            migrationBuilder.DropColumn(
                name: "UpdatedByPilotId",
                table: "Crew");
        }
    }
}

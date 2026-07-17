using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AltitudELog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginICAO = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    DestinationICAO = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    FlightTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    AircraftType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    METARInfo = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pilots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LicenseNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Rank = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pilots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Crew",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightId = table.Column<Guid>(type: "uuid", nullable: false),
                    PilotId = table.Column<Guid>(type: "uuid", nullable: false),
                    DutyRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Crew", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Crew_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Crew_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CRMReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    IsAnonymous = table.Column<bool>(type: "boolean", nullable: false),
                    SeverityLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FlightId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReporterId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CRMReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CRMReports_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CRMReports_Pilots_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Crew_FlightId_PilotId",
                table: "Crew",
                columns: new[] { "FlightId", "PilotId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Crew_PilotId",
                table: "Crew",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_CRMReports_FlightId",
                table: "CRMReports",
                column: "FlightId");

            migrationBuilder.CreateIndex(
                name: "IX_CRMReports_ReporterId",
                table: "CRMReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_LicenseNumber",
                table: "Pilots",
                column: "LicenseNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Crew");

            migrationBuilder.DropTable(
                name: "CRMReports");

            migrationBuilder.DropTable(
                name: "Flights");

            migrationBuilder.DropTable(
                name: "Pilots");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class TechnicianTeamMemberships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TechnicianTeams",
                columns: table => new
                {
                    TechnicianId = table.Column<int>(type: "INTEGER", nullable: false),
                    TeamId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianTeams", x => new { x.TechnicianId, x.TeamId });
                    table.ForeignKey(
                        name: "FK_TechnicianTeams_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TechnicianTeams_Technicians_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Technicians",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianTeams_TeamId",
                table: "TechnicianTeams",
                column: "TeamId");

            // Copy existing single-team assignments before removing the old technician column.
            migrationBuilder.Sql(
                """
                INSERT INTO "TechnicianTeams" ("TechnicianId", "TeamId")
                SELECT "Id", "TeamId"
                FROM "Technicians"
                WHERE "TeamId" IS NOT NULL;
                """
            );

            migrationBuilder.DropForeignKey(
                name: "FK_Technicians_Teams_TeamId",
                table: "Technicians");

            migrationBuilder.DropIndex(
                name: "IX_Technicians_TeamId",
                table: "Technicians");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Technicians");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeamId",
                table: "Technicians",
                type: "INTEGER",
                nullable: true);

            // Rollback can restore only one team, so keep the lowest ID when memberships are multiple.
            migrationBuilder.Sql(
                """
                UPDATE "Technicians"
                SET "TeamId" = (
                    SELECT MIN("TeamId")
                    FROM "TechnicianTeams"
                    WHERE "TechnicianId" = "Technicians"."Id"
                );
                """
            );

            migrationBuilder.DropTable(
                name: "TechnicianTeams");

            migrationBuilder.CreateIndex(
                name: "IX_Technicians_TeamId",
                table: "Technicians",
                column: "TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_Technicians_Teams_TeamId",
                table: "Technicians",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

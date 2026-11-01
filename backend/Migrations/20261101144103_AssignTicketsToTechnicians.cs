using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AssignTicketsToTechnicians : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedTechnicianId",
                table: "Tickets",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            // Assign existing tickets round-robin in stable ID order across seeded technicians 1-4.
            migrationBuilder.Sql(
                """
                UPDATE "Tickets"
                SET "AssignedTechnicianId" = (
                    SELECT ((COUNT(*) - 1) % 4) + 1
                    FROM "Tickets" AS earlier
                    WHERE earlier."Id" <= "Tickets"."Id"
                );
                """
            );

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AssignedTechnicianId",
                table: "Tickets",
                column: "AssignedTechnicianId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Technicians_AssignedTechnicianId",
                table: "Tickets",
                column: "AssignedTechnicianId",
                principalTable: "Technicians",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Technicians_AssignedTechnicianId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_AssignedTechnicianId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "AssignedTechnicianId",
                table: "Tickets");
        }
    }
}

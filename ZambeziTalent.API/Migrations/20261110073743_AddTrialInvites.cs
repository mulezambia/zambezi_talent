using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZambeziTalent.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialInvites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrialInvites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ScoutEmail = table.Column<string>(type: "TEXT", nullable: false),
                    ScoutName = table.Column<string>(type: "TEXT", nullable: false),
                    TalentEmail = table.Column<string>(type: "TEXT", nullable: false),
                    TalentName = table.Column<string>(type: "TEXT", nullable: false),
                    TrialDate = table.Column<string>(type: "TEXT", nullable: false),
                    TrialTime = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrialInvites", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrialInvites");
        }
    }
}

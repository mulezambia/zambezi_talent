using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZambeziTalent.API.Migrations
{
    /// <inheritdoc />
    public partial class AddShortlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Shortlists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ScoutEmail = table.Column<string>(type: "TEXT", nullable: false),
                    TalentId = table.Column<int>(type: "INTEGER", nullable: false),
                    TalentName = table.Column<string>(type: "TEXT", nullable: false),
                    TalentPosition = table.Column<string>(type: "TEXT", nullable: false),
                    TalentProvince = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shortlists", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Shortlists");
        }
    }
}

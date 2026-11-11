using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZambeziTalent.API.Migrations
{
    /// <inheritdoc />
    public partial class AddScoutPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ScoutPhone",
                table: "ContactRequests",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScoutPhone",
                table: "ContactRequests");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AddCalendarAppointment.Migrations
{
    /// <inheritdoc />
    public partial class invitevialink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingCode",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequireApproval",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingCode",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RequireApproval",
                table: "Appointments");
        }
    }
}

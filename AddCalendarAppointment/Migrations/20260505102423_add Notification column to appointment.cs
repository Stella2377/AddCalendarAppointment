using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AddCalendarAppointment.Migrations
{
    /// <inheritdoc />
    public partial class addNotificationcolumntoappointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notification",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notification",
                table: "Appointments");
        }
    }
}

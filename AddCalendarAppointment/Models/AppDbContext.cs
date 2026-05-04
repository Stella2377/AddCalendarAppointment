using Microsoft.EntityFrameworkCore;

namespace AddCalendarAppointment.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Khai báo các bảng sẽ được tạo trong CSDL
        public DbSet<User> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        // Không cần khai báo DbSet<GroupMeeting> vì nó đã kế thừa Appointment
        public DbSet<Reminder> Reminders { get; set; }
    }
}
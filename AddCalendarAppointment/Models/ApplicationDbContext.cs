using AddCalendarAppointment.Models;
using Microsoft.EntityFrameworkCore;

namespace AddCalendarAppointment.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Reminder> Reminders { get; set; }
        public DbSet<AppointmentGuest> AppointmentGuests { get; set; }
        public DbSet<UserSettings> UserSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Appointment>().HasQueryFilter(a => !a.IsDeleted);

            modelBuilder.Entity<Team>()
                .HasOne(t => t.Owner)
                .WithMany(u => u.OwnedTeams)
                .HasForeignKey(t => t.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Team>()
                .HasMany(t => t.Members)
                .WithMany(u => u.JoinedTeams)
                .UsingEntity<Dictionary<string, object>>(
                    "TeamMembers",
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Team>().WithMany().HasForeignKey("TeamId").OnDelete(DeleteBehavior.Cascade)
                );

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Owner)
                .WithMany(u => u.OwnedAppointments)
                .HasForeignKey(a => a.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Team)
                .WithMany(t => t.Appointments)
                .HasForeignKey(a => a.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<AppointmentGuest>()
                .HasKey(ag => new { ag.AppointmentId, ag.UserId });

            modelBuilder.Entity<AppointmentGuest>()
                .HasOne(ag => ag.Appointment)
                .WithMany(a => a.Guests)
                .HasForeignKey(ag => ag.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AppointmentGuest>()
                .HasOne(ag => ag.User)
                .WithMany(u => u.AppointmentInvitations)
                .HasForeignKey(ag => ag.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserSettings>()
                .HasOne(us => us.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettings>(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
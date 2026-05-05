using System;
using System.Linq;
using AddCalendarAppointment.Models;

namespace AddCalendarAppointment.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            // Nếu đã có User thì không seed nữa
            if (context.Users.Any()) return;

            // 1. Tạo Users
            var mainUser = new User { Id = Guid.NewGuid(), Username = "main_user", Email = "main@dut.edu.vn", FullName = "DUT Student", Password = "123456" };
            var member1 = new User { Id = Guid.NewGuid(), Username = "quynhnhu", Email = "nhu@dut.edu.vn", FullName = "Quỳnh Như", Password = "123456" };
            var member2 = new User { Id = Guid.NewGuid(), Username = "baongoc", Email = "ngoc@dut.edu.vn", FullName = "Bảo Ngọc", Password = "123456" };

            context.Users.AddRange(mainUser, member1, member2);

            // 2. Tạo User Settings cho Main User
            var settings = new UserSettings
            {
                Id = Guid.NewGuid(),
                UserId = mainUser.Id,
                LanguageRegion = "vi-VN",
                TimeZone = "GMT+07:00",
                DateFormat = "dd/MM/yyyy",
                TimeFormat = "12h",
                DefaultDuration = 60,
                NotificationType = NotificationType.Alerts,

                // GÁN GIÁ TRỊ VÀO ĐÂY ĐỂ FIX LỖI SQL
                ShowSnoozed = "1 minute before event",

                ShowWeekends = true,
                ShowDeclined = true,
                ShowCompleted = true,
                StartWeekOn = DayOfWeek.Monday,
                CustomViewDays = "7"
            };
            context.UserSettings.Add(settings);


            // 3. Tạo Teams
            var team1 = new Team { Id = Guid.NewGuid(), Name = "Heroes Company", Description = "Hugo English Club - Heroes Company", CreatedTime = DateTime.UtcNow, OwnerId = mainUser.Id };
            var team2 = new Team { Id = Guid.NewGuid(), Name = "Book Blossom Team", Description = "PBL3 - Brand Store Project", CreatedTime = DateTime.UtcNow, OwnerId = mainUser.Id };

            context.Teams.AddRange(team1, team2);
            context.SaveChanges(); // Lưu để gen ID cho các bảng trung gian

            // Add members to teams
            team1.Members = new[] { mainUser, member1, member2 }.ToList();
            team2.Members = new[] { mainUser, member1 }.ToList();

            // 4. Tạo Appointments (Mô phỏng lịch tháng 5/2026)
            var baseDate = new DateTime(2026, 5, 18); // Ngày hiển thị trên giao diện của bạn

            var app1 = new Appointment
            {
                Id = Guid.NewGuid(),
                Title = "Học Java",
                StartTime = baseDate.AddHours(9),
                EndTime = baseDate.AddHours(11).AddMinutes(50),
                Location = "F408",
                ColorCategory = "#7986cb",
                Visibility = VisibilityType.Private,
                OwnerId = mainUser.Id,
                Description = "Hoc Java" // Bổ sung
            };

            var app2 = new Appointment
            {
                Id = Guid.NewGuid(),
                Title = "Họp PBL3 Book Blossom",
                StartTime = baseDate.AddDays(1).AddHours(9),
                EndTime = baseDate.AddDays(1).AddHours(11),
                Location = "", // Bổ sung
                ColorCategory = "#3f51b5",
                Visibility = VisibilityType.Public,
                OwnerId = mainUser.Id,
                TeamId = team2.Id,
                Description = "PBL3" // Bổ sung
            };

            var app3 = new Appointment
            {
                Id = Guid.NewGuid(),
                Title = "Mạng máy tính",
                StartTime = baseDate.AddDays(1).AddHours(7),
                EndTime = baseDate.AddDays(1).AddHours(8).AddMinutes(50),
                Location = "F107",
                ColorCategory = "#3f51b5",
                Visibility = VisibilityType.Private,
                OwnerId = member1.Id,
                Description = "PBL3" // Bổ sung
            };

            context.Appointments.AddRange(app1, app2, app3);

            // 5. Tạo Guest Invitations (Mô phỏng trạng thái Pending / Maybe)
            var guest1 = new AppointmentGuest
            {
                AppointmentId = app3.Id,
                UserId = mainUser.Id,
                Status = GuestStatus.Maybe // Main user được mời vào "Mạng máy tính" và click Maybe
            };

            context.AppointmentGuests.Add(guest1);
            context.SaveChanges();
        }
    }
}
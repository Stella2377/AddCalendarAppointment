using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace AddCalendarAppointment.Services
{
    public enum RecurringEditType
    {
        ThisEvent,
        ThisAndFollowing,
        AllEvents
    }

    public class AppointmentService
    {
        private readonly ApplicationDbContext _context;

        public AppointmentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Appointment>> GetAppointmentsAsync(Guid userId)
        {
            return await _context.Appointments
                //.Where(a => a.OwnerId == userId && !a.IsDeleted)
                //.ToListAsync();
                .Where(a => !a.IsDeleted)
                .ToListAsync();
        }

        public async Task UpdateAppointmentAsync(Appointment appointment)
        {
            // Giả sử biến ngữ cảnh database của bạn tên là _context
            // Nếu trong Service bạn đặt tên khác (ví dụ _db), hãy đổi tên cho khớp
            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();
        }

        public async Task<TimeSpan> GetUserDefaultDurationAsync(Guid userId)
        {
            var settings = await _context.UserSettings.FirstOrDefaultAsync(u => u.UserId == userId);
            int minutes = settings?.DefaultDuration ?? 60;
            return TimeSpan.FromMinutes(minutes);
        }


        public async Task<(bool isSuccess, string errorMessage, bool suggestTeamJoin, Guid? suggestedTeamId)> CreateAppointmentAsync(Appointment appointment, Guid userId)
        {
            if (appointment.EndTime == default || appointment.EndTime == appointment.StartTime)
            {
                var defaultDuration = await GetUserDefaultDurationAsync(userId);
                appointment.EndTime = appointment.StartTime.Add(defaultDuration);
            }
            else if (appointment.EndTime < appointment.StartTime)
            {
                appointment.EndTime = appointment.EndTime.AddDays(1);
            }

            bool hasOverlap = await _context.Appointments
                .AnyAsync(a => a.OwnerId == userId && a.StartTime < appointment.EndTime && a.EndTime > appointment.StartTime);

            if (hasOverlap)
            {
                return (false, "Overlapping appointments are not allowed.", false, null);
            }

            // Tính toán duration
            TimeSpan currentDuration = appointment.EndTime - appointment.StartTime;

            // Bước 1: Lấy danh sách các cuộc hẹn trùng tên và người dùng có trong Team từ Database lên
            var potentialDuplicates = await _context.Appointments
                .Include(a => a.Team)
                .ThenInclude(t => t.Members)
                .Where(a => a.TeamId != null
                         && a.Title.Contains(appointment.Title)
                         && a.Team.Members.Any(m => m.Id == userId))
                .ToListAsync();

            // Bước 2: Dùng C# để kiểm tra khoảng thời gian (tránh lỗi EF Core Translation)
            var teamDuplicate = potentialDuplicates
                .FirstOrDefault(a => (a.EndTime - a.StartTime) == currentDuration);

            if (teamDuplicate != null)
            {
                return (false, "Duplicate found in team.", true, teamDuplicate.TeamId);
            }

            appointment.OwnerId = userId;
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return (true, string.Empty, false, null);
        }

        public async Task<bool> EditRecurringAsync(Guid originalId, RecurringEditType editType, Appointment newData)
        {
            var originalEvent = await _context.Appointments.FindAsync(originalId);
            if (originalEvent == null) return false;

            if (editType == RecurringEditType.ThisEvent)
            {
                var exceptionEvent = new Appointment
                {
                    Title = newData.Title,
                    StartTime = newData.StartTime,
                    EndTime = newData.EndTime,
                    Location = newData.Location,
                    Description = newData.Description,
                    OwnerId = originalEvent.OwnerId,
                    IsRecurring = false
                };
                _context.Appointments.Add(exceptionEvent);
            }
            else if (editType == RecurringEditType.ThisAndFollowing)
            {
                originalEvent.EndTime = newData.StartTime.AddTicks(-1);

                var newSeries = new Appointment
                {
                    Title = newData.Title,
                    StartTime = newData.StartTime,
                    EndTime = newData.EndTime,
                    IsRecurring = true,
                    RecurringRule = newData.RecurringRule,
                    OwnerId = originalEvent.OwnerId
                };
                _context.Appointments.Add(newSeries);
            }
            else if (editType == RecurringEditType.AllEvents)
            {
                var allSeriesEvents = await _context.Appointments
                    .Where(a => a.OwnerId == originalEvent.OwnerId && a.Title == originalEvent.Title && a.IsRecurring)
                    .ToListAsync();

                foreach (var evt in allSeriesEvents)
                {
                    evt.Title = newData.Title;
                    evt.Location = newData.Location;
                    evt.Description = newData.Description;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Appointment>> GetTrashAsync(Guid userId)
        {
            return await _context.Appointments
                .IgnoreQueryFilters()
                .Where(a => a.OwnerId == userId && a.IsDeleted)
                .ToListAsync();
        }

        public async Task RestoreTrashAsync(List<Guid> appointmentIds, Guid userId)
        {
            var events = await _context.Appointments
                .IgnoreQueryFilters()
                .Where(a => appointmentIds.Contains(a.Id) && a.OwnerId == userId && a.IsDeleted)
                .ToListAsync();

            foreach (var evt in events)
            {
                evt.IsDeleted = false;
                evt.DeletedDate = null;
            }

            await _context.SaveChangesAsync();
        }

        public async Task EmptyTrashAsync(Guid userId)
        {
            var trashEvents = await _context.Appointments
                .IgnoreQueryFilters()
                .Where(a => a.OwnerId == userId && a.IsDeleted)
                .ToListAsync();

            _context.Appointments.RemoveRange(trashEvents);
            await _context.SaveChangesAsync();
        }
    }
}
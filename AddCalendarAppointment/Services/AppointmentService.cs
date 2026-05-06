using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static AddCalendarAppointment.Controllers.AppointmentController;

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
                .Include(a => a.Guests)
                .Include(a => a.Team)
                .Where(a => !a.IsDeleted && (
                    (a.Visibility == VisibilityType.Private && a.OwnerId == userId) || 
                    (a.Guests.Any(g => g.UserId == userId))
                ))
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


        public async Task<(bool isSuccess, string errorMessage, bool suggestTeamJoin, Guid? suggestedAppointmentId, bool suggestOverlapReplacement, Appointment overlappingAppt)> CreateAppointmentAsync(Appointment appointment, Guid userId)
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

            var overlappingAppt = await _context.Appointments
                .FirstOrDefaultAsync(a => a.OwnerId == userId && a.StartTime < appointment.EndTime && a.EndTime > appointment.StartTime && !a.IsDeleted);
            
            if (overlappingAppt != null)
            {
                // Gợi ý thay thế nếu bị trùng với bất kỳ lịch nào của chính mình
                return (false, "Overlap detected", false, null, true, overlappingAppt);
            }

            if (appointment.Visibility == VisibilityType.Public && appointment.TeamId != null)
            {
                // Tính toán duration
                TimeSpan currentDuration = appointment.EndTime - appointment.StartTime;

                // Kiểm tra xem trong Team đã có cuộc họp nào CÙNG TÊN và CÙNG THỜI LƯỢNG chưa
                var teamDuplicate = await _context.Appointments
                    .Where(a => a.TeamId == appointment.TeamId
                             && a.Visibility == VisibilityType.Public
                             && a.Title == appointment.Title
                             && !a.IsDeleted)
                    .ToListAsync();

                var exactDuplicate = teamDuplicate.FirstOrDefault(a => (a.EndTime - a.StartTime) == currentDuration);

                if (exactDuplicate != null)
                {
                    // Trả về suggestTeamJoin = true và ID của cuộc họp đó để Frontend hỏi Join
                    return (false, "Duplicate found", true, exactDuplicate.Id, false, null);
                }

                // Kiểm tra xem có bị chồng lấn (overlap) với cuộc họp Public nào khác của Team không
                bool hasTeamOverlap = await _context.Appointments
                    .AnyAsync(a => a.TeamId == appointment.TeamId
                                 && a.Visibility == VisibilityType.Public
                                 && a.StartTime < appointment.EndTime
                                 && a.EndTime > appointment.StartTime
                                 && !a.IsDeleted);

                if (hasTeamOverlap)
                {
                    return (false, "Khung giờ này đã có một cuộc họp nhóm khác đang diễn ra. Vui lòng đổi giờ, đổi tên hoặc chuyển sang chế độ Private.", false, null, false, null);
                }
            }

            appointment.OwnerId = userId;
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return (true, string.Empty, false, null, false, null);
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

        public async Task<bool> DeleteAppointmentAsync(Guid id, Guid userId)
        {
            var appt = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.OwnerId == userId);
            if (appt == null) return false;

            appt.IsDeleted = true; // Xóa mềm
            appt.DeletedDate = DateTime.Now;
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
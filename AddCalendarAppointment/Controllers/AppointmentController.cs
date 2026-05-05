using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using AddCalendarAppointment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Text;
using System.Globalization;
using System.Text.RegularExpressions;

namespace AddCalendarAppointment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly AppointmentService _appointmentService;
        private readonly ApplicationDbContext _context;
        public AppointmentController(AppointmentService appointmentService, ApplicationDbContext context)
        {
            _appointmentService = appointmentService;
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            // Tìm ID người dùng cất trong Session (do AccountController lưu)
            var userIdStr = HttpContext.Session.GetString("UserId");

            // Nếu có Session và ép kiểu thành Guid thành công
            if (!string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out Guid userId))
            {
                return userId; // Trả về ID thật của người dùng
            }

            // Nếu Session trống (chưa đăng nhập hoặc Session hết hạn)
            throw new UnauthorizedAccessException("Bạn chưa đăng nhập hoặc Session đã hết hạn!");
        }

        [HttpGet("GetAppointments")]
        public async Task<IActionResult> GetAppointments()
        {
            var userId = GetCurrentUserId();

            // Ép EF Core load thêm bảng Guests và User để lấy Email
            var appointments = await _context.Appointments
                .Include(a => a.Guests)
                    .ThenInclude(g => g.User)
                .Include(a => a.Team) // Thêm Team để lấy tên
                .Include(a => a.Owner) // Thêm Owner để lấy email
                .Where(a => !a.IsDeleted &&
                            (a.OwnerId == userId || a.Guests.Any(g => g.UserId == userId)))
                .ToListAsync();

            var calendarEvents = appointments.Select(a => new
            {
                id = a.Id,
                title = a.Title,
                location = a.Location,
                description = a.Description,
                start = a.StartTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                end = a.EndTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                color = a.ColorCategory ?? "#039be5",
                notification = a.Notification ?? "30 minutes before",
                guests = a.Guests != null ? a.Guests.Select(g => g.User.Email).ToList() : new List<string>(),
                visibility = (int)a.Visibility,
                teamName = a.Team?.Name,
                teamId = a.TeamId,
                ownerEmail = a.Owner?.Email
            });

            return Ok(calendarEvents);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest req)
        {
            var userId = GetCurrentUserId();

            var overlaps = await _context.Appointments
                .Where(a => !a.IsDeleted
                         && (a.OwnerId == userId || a.Guests.Any(g => g.UserId == userId))
                         && a.StartTime < req.EndTime && a.EndTime > req.StartTime) // Công thức giao nhau
                .ToListAsync();

            if (overlaps.Any())
            {
                if (!req.OverwriteOverlap)
                {
                    // Nếu chưa cho phép ghi đè -> Báo về JS để hiện Popup hỏi ý kiến
                    return Ok(new { success = false, isOverlap = true, message = "Thời gian này đã có lịch. Bạn có muốn thay thế lịch cũ không?" });
                }
                else
                {
                    // Nếu người dùng chọn "Thay thế" -> Xóa các lịch bị trùng
                    foreach (var oldAppt in overlaps)
                    {
                        await _appointmentService.DeleteAppointmentAsync(oldAppt.Id, userId);
                    }
                }
            }

            // 1. Chuyển dữ liệu từ Request sang Model Appointment
            var appointment = new Appointment
            {
                Title = req.Title,
                StartTime = req.StartTime,
                EndTime = req.EndTime,
                Location = req.Location,
                Description = req.Description,
                ColorCategory = req.ColorCategory,
                Visibility = req.Visibility,
                IsRecurring = req.IsRecurring,
                RecurringRule = req.RecurringRule,
                OwnerId = userId,
                Guests = new List<AppointmentGuest>(),
                Notification = req.Notification,
                TeamId = req.TeamId
            };

            // 2. Tìm kiếm và thêm Guests từ danh sách Email
            if (req.GuestEmails != null && req.GuestEmails.Any())
            {
                var guests = _context.Users.Where(u => req.GuestEmails.Contains(u.Email)).ToList();
                foreach (var guest in guests)
                {
                    appointment.Guests.Add(new AppointmentGuest
                    {
                        UserId = guest.Id,
                        Status = GuestStatus.Pending
                    });
                }
            }

            // 3. Lưu qua Service
            var result = await _appointmentService.CreateAppointmentAsync(appointment, userId);

            if (result.suggestTeamJoin)
                return Ok(new { suggestTeamJoin = true, teamId = result.suggestedTeamId, message = "Would you like to join the existing team meeting?" });

            if (!result.isSuccess)
                return BadRequest(new { error = result.errorMessage });

            return Ok(new { success = true });
        }

        [HttpGet("get-user-teams")]
        public async Task<IActionResult> GetUserTeams()
        {
            try
            {
                var userId = GetCurrentUserId();
                var teams = await _context.Teams
                    .Where(t => t.Members.Any(m => m.Id == userId))
                    .Select(t => new { id = t.Id, name = t.Name })
                    .ToListAsync();
                return Ok(teams);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("search-users")]
        public IActionResult SearchUsers([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return Ok(new List<object>());

            var users = _context.Users
                .Where(u => u.Email.Contains(email))
                .Select(u => new { u.Email, u.Username })
                .Take(5) // Lấy tối đa 5 người gợi ý
                .ToList();

            return Ok(users);
        }

        [HttpPost("edit-recurring/{id}")]
        public async Task<IActionResult> EditRecurring(Guid id, [FromQuery] RecurringEditType type, [FromBody] Appointment newData)
        {
            var success = await _appointmentService.EditRecurringAsync(id, type, newData);
            if (!success) return NotFound();
            return Ok(new { success = true });
        }

        [HttpGet("trash")]
        public async Task<IActionResult> GetTrash()
        {
            var userId = GetCurrentUserId();
            var trash = await _appointmentService.GetTrashAsync(userId);
            return Ok(trash);
        }

        [HttpPost("trash/restore")]
        public async Task<IActionResult> RestoreTrash([FromBody] List<Guid> ids)
        {
            var userId = GetCurrentUserId();
            await _appointmentService.RestoreTrashAsync(ids, userId);
            return Ok(new { success = true });
        }

        [HttpDelete("trash/empty")]
        public async Task<IActionResult> EmptyTrash()
        {
            var userId = GetCurrentUserId();
            await _appointmentService.EmptyTrashAsync(userId);
            return Ok(new { success = true });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetCurrentUserId();
            var success = await _appointmentService.DeleteAppointmentAsync(id, userId);
            if (!success) return NotFound(new { success = false, message = "Không tìm thấy cuộc hẹn hoặc bạn không có quyền xóa." });
            return Ok(new { success = true });
        }

        [HttpPost("update-time")]
        public async Task<IActionResult> UpdateTime([FromBody] UpdateTimeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId(); // Lấy ID người dùng từ Session

                // Chuyển đổi thời gian String sang DateTime trước để dùng kiểm tra trùng lặp
                DateTime newStart = DateTime.Parse(request.StartTime);
                DateTime newEnd = DateTime.Parse(request.EndTime);

                // --- THÊM LOGIC CHECK TRÙNG LỊCH ---
                var overlaps = await _context.Appointments
                    .Where(a => !a.IsDeleted
                             && a.Id != request.Id // Bỏ qua chính cuộc hẹn đang kéo thả
                             && (a.OwnerId == userId || a.Guests.Any(g => g.UserId == userId))
                             && a.StartTime < newEnd && a.EndTime > newStart)
                    .ToListAsync();

                if (overlaps.Any())
                {
                    if (!request.OverwriteOverlap)
                    {
                        return Ok(new { success = false, isOverlap = true, message = "Thời gian này đã có lịch. Bạn có muốn thay thế lịch cũ không?" });
                    }
                    else
                    {
                        foreach (var oldAppt in overlaps)
                        {
                            await _appointmentService.DeleteAppointmentAsync(oldAppt.Id, userId);
                        }
                    }
                }
                // --- KẾT THÚC LOGIC CHECK TRÙNG ---


                // Gọi Service để tìm cuộc hẹn
                var appointments = await _appointmentService.GetAppointmentsAsync(userId);
                var appt = appointments.FirstOrDefault(a => a.Id == request.Id);

                if (appt == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc hẹn hoặc bạn không có quyền sửa." });

                // Cập nhật thời gian mới
                appt.StartTime = newStart;
                appt.EndTime = newEnd;

                // Lưu thay đổi
                await _appointmentService.UpdateAppointmentAsync(appt);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("join/{id}")]
        public async Task<IActionResult> Join(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var targetMeeting = await _context.Appointments
                    .Include(a => a.Guests)
                    .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

                if (targetMeeting == null)
                    return NotFound(new { success = false, message = "Cuộc họp không tồn tại!" });

                // Kiểm tra trùng lịch
                var overlapAppt = await _context.Appointments
                    .Include(a => a.Guests)
                    .Where(a => !a.IsDeleted
                             && a.StartTime < targetMeeting.EndTime
                             && a.EndTime > targetMeeting.StartTime)
                    .Where(a => a.OwnerId == userId || (a.Guests != null && a.Guests.Any(g => g.UserId == userId)))
                    .FirstOrDefaultAsync();

                if (overlapAppt != null)
                {
                    return Ok(new { success = false, message = $"Trùng lịch với: '{overlapAppt.Title}' ({overlapAppt.StartTime:HH:mm}-{overlapAppt.EndTime:HH:mm})" });
                }

                if (targetMeeting.Guests == null) targetMeeting.Guests = new List<AppointmentGuest>();

                if (!targetMeeting.Guests.Any(g => g.UserId == userId))
                {
                    targetMeeting.Guests.Add(new AppointmentGuest
                    {
                        UserId = userId,
                        Status = GuestStatus.Accepted
                    });
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("join-by-code")]
        public async Task<IActionResult> JoinByCode([FromBody] string meetingCode)
        {
            var userId = GetCurrentUserId();

            // 1. Tìm cuộc họp dựa trên Code
            var targetMeeting = await _context.Appointments
                .Include(a => a.Guests)
                .FirstOrDefaultAsync(a => a.MeetingCode == meetingCode && !a.IsDeleted);

            if (targetMeeting == null)
                return NotFound(new { success = false, message = "Mã cuộc họp không tồn tại!" });

            // 2. Thuật toán kiểm tra trùng lịch (Overlap Check)
            var overlapAppt = await _context.Appointments
                .Include(a => a.Guests)
                .Where(a => !a.IsDeleted
                         && a.StartTime < targetMeeting.EndTime
                         && a.EndTime > targetMeeting.StartTime) // Công thức kinh điển check giao nhau
                .Where(a => a.OwnerId == userId || a.Guests.Any(g => g.UserId == userId)) // Của mình hoặc mình là khách
                .FirstOrDefaultAsync();

            if (overlapAppt != null)
            {
                return Ok(new
                {
                    success = false,
                    isOverlap = true,
                    message = $"Cảnh báo chồng lấn lịch! Trùng với sự kiện: '{overlapAppt.Title}' (Từ {overlapAppt.StartTime:HH:mm} - {overlapAppt.EndTime:HH:mm}). Bạn cần giải quyết lịch trùng trước khi tham gia."
                });
            }

            // 3. Xử lý thêm vào danh sách Guests nếu chưa có
            if (!targetMeeting.Guests.Any(g => g.UserId == userId))
            {
                // Xét cờ RequireApproval để set Status
                var guestStatus = targetMeeting.RequireApproval ? GuestStatus.Pending : GuestStatus.Accepted;

                targetMeeting.Guests.Add(new AppointmentGuest
                {
                    UserId = userId,
                    Status = guestStatus
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, requireApproval = targetMeeting.RequireApproval });
        }


        // DTO nhận dữ liệu từ JS
        public class UpdateTimeRequest
        {
            public Guid Id { get; set; }
            public string StartTime { get; set; }
            public string EndTime { get; set; }
            public bool OverwriteOverlap { get; set; } = false;
        }


        public class CreateAppointmentRequest
        {
            public string Title { get; set; }
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
            public string? Location { get; set; }
            public string? Description { get; set; }
            public string? ColorCategory { get; set; }
            public VisibilityType Visibility { get; set; }
            public bool IsRecurring { get; set; }
            public RecurringType RecurringRule { get; set; }
            public List<string>? GuestEmails { get; set; } // Nhận danh sách Email từ Frontend
            public string? Notification { get; set; }
            public Guid? TeamId { get; set; }
            public bool OverwriteOverlap { get; set; } = false;
        }

        // 1. Thêm Class Request để nhận dữ liệu Update từ Javascript
        public class UpdateAppointmentRequest : CreateAppointmentRequest
        {
            public Guid Id { get; set; }
        }

        // 2. Thêm API xử lý việc Update
        [HttpPost("update")]
        public async Task<IActionResult> Update([FromBody] UpdateAppointmentRequest req)
        {
            try
            {
                var userId = GetCurrentUserId();

                var overlaps = await _context.Appointments
                    .Where(a => !a.IsDeleted
                             && a.Id != req.Id // Quan trọng: Bỏ qua chính cuộc hẹn đang sửa
                             && (a.OwnerId == userId || a.Guests.Any(g => g.UserId == userId))
                             && a.StartTime < req.EndTime && a.EndTime > req.StartTime) // Công thức giao nhau
                    .ToListAsync();

                if (overlaps.Any())
                {
                    if (!req.OverwriteOverlap)
                    {
                        // Nếu chưa cho phép ghi đè -> Trả cờ isOverlap về cho Javascript bật Popup
                        return Ok(new { success = false, isOverlap = true, message = "Thời gian này đã có lịch. Bạn có muốn thay thế lịch cũ không?" });
                    }
                    else
                    {
                        // Nếu đồng ý "Thay thế" -> Xóa các sự kiện bị đè
                        foreach (var oldAppt in overlaps)
                        {
                            await _appointmentService.DeleteAppointmentAsync(oldAppt.Id, userId);
                        }
                    }
                }

                // Lấy cuộc hẹn CÓ BAO GỒM danh sách Guests từ DB
                var appt = await _context.Appointments
                    .Include(a => a.Guests)
                    .FirstOrDefaultAsync(a => a.Id == req.Id);

                if (appt == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc hẹn hoặc bạn không có quyền sửa." });

                // Cập nhật các thông tin cơ bản
                appt.Title = string.IsNullOrWhiteSpace(req.Title) ? "(No title)" : req.Title;
                appt.StartTime = req.StartTime;
                appt.EndTime = req.EndTime;
                appt.Location = req.Location;
                appt.Description = req.Description;
                appt.ColorCategory = req.ColorCategory;
                appt.Visibility = req.Visibility;
                appt.Notification = req.Notification;
                appt.TeamId = req.TeamId;

                // --- XỬ LÝ CẬP NHẬT GUESTS ---
                if (req.GuestEmails == null) req.GuestEmails = new List<string>();

                // Lấy ra danh sách User tương ứng với mảng Email gửi lên
                var newGuestUsers = await _context.Users.Where(u => req.GuestEmails.Contains(u.Email)).ToListAsync();
                var newGuestUserIds = newGuestUsers.Select(u => u.Id).ToList();

                // 1. Tìm ra những khách mời cũ không còn nằm trong danh sách mới
                var guestsToRemove = appt.Guests.Where(g => !newGuestUserIds.Contains(g.UserId)).ToList();

                // 2. Xóa từng người khỏi danh sách
                foreach (var guestToRemove in guestsToRemove)
                {
                    appt.Guests.Remove(guestToRemove);
                }

                // 2. Thêm những khách mời mới (chưa tồn tại trong cuộc hẹn)
                foreach (var user in newGuestUsers)
                {
                    if (!appt.Guests.Any(g => g.UserId == user.Id))
                    {
                        appt.Guests.Add(new AppointmentGuest
                        {
                            UserId = user.Id,
                            Status = GuestStatus.Pending
                        });
                    }
                }

                // Lưu toàn bộ thay đổi thẳng vào Database
                await _context.SaveChangesAsync();

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
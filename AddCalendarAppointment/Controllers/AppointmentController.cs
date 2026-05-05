using AddCalendarAppointment.Models;
using AddCalendarAppointment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AddCalendarAppointment.Data;

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
            var appointments = await _appointmentService.GetAppointmentsAsync(userId);

            var calendarEvents = appointments.Select(a => new
            {
                id = a.Id,
                title = a.Title,
                location = a.Location, // Bổ sung trường Location
                start = a.StartTime.ToString("yyyy-MM-ddTHH:mm:ss"),    
                end = a.EndTime.ToString("yyyy-MM-ddTHH:mm:ss"), // Backend đã truyền đủ Start/End
                color = a.ColorCategory ?? "#039be5"
            });

            return Ok(calendarEvents);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest req)
        {
            var userId = GetCurrentUserId();

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
                Guests = new List<AppointmentGuest>()
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

        [HttpPost("update-time")]
        public async Task<IActionResult> UpdateTime([FromBody] UpdateTimeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId(); // Lấy ID người dùng từ Session

                // Gọi Service để tìm cuộc hẹn
                // Giả sử Service của bạn có hàm GetById hoặc bạn có thể gọi trực tiếp DB qua Context
                var appointments = await _appointmentService.GetAppointmentsAsync(userId);
                var appt = appointments.FirstOrDefault(a => a.Id == request.Id);

                if (appt == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc hẹn hoặc bạn không có quyền sửa." });

                // Cập nhật thời gian mới
                appt.StartTime = DateTime.Parse(request.StartTime);
                appt.EndTime = DateTime.Parse(request.EndTime);

                // Lưu thay đổi (Giả sử Service của bạn có hàm Update)
                // Nếu Service chưa có, bạn cần bổ sung hàm Update vào AppointmentService
                await _appointmentService.UpdateAppointmentAsync(appt);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DTO nhận dữ liệu từ JS
        public class UpdateTimeRequest
        {
            public Guid Id { get; set; }
            public string StartTime { get; set; }
            public string EndTime { get; set; }
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] SearchRequest req)
        {
            var userId = GetCurrentUserId();
            // Gọi Service xử lý logic lọc
            var results = await _appointmentService.SearchAppointmentsAsync(userId, req);

            // Trả về dữ liệu format giống GetAppointments để JS dễ xử lý
            return Ok(results.Select(a => new {
                id = a.Id,
                title = a.Title,
                start = a.StartTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                end = a.EndTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                location = a.Location
            }));
        }

        public class SearchRequest
        {
            public string Keyword { get; set; }
            public string Location { get; set; }
            public string FromDate { get; set; }
            public string ToDate { get; set; }
        }
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
    }
}
using AddCalendarAppointment.Models;
using AddCalendarAppointment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AddCalendarAppointment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly AppointmentService _appointmentService;

        public AppointmentController(AppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
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
        public async Task<IActionResult> Create([FromBody] Appointment appointment)
        {
            var userId = GetCurrentUserId();
            appointment.OwnerId = userId;

            // Đẩy xuống Service để lưu vào DB
            var result = await _appointmentService.CreateAppointmentAsync(appointment, userId);

            if (result.suggestTeamJoin)
            {
                return Ok(new { suggestTeamJoin = true, teamId = result.suggestedTeamId, message = "Would you like to join the existing team meeting?" });
            }

            if (!result.isSuccess)
            {
                return BadRequest(new { error = result.errorMessage });
            }

            return Ok(new { success = true });
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
    }
}
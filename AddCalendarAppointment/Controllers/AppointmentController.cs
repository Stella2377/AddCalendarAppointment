using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AddCalendarAppointment.Models;
using AddCalendarAppointment.Services;
using Microsoft.AspNetCore.Mvc;

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
            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] Appointment appointment)
        {
            var userId = GetCurrentUserId();
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
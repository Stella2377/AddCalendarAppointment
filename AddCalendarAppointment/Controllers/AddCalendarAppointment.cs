using System;
using System.Linq;
using System.Threading.Tasks;
using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AddCalendarAppointment.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeamController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTeam([FromBody] Team team)
        {
            team.OwnerId = GetCurrentUserId();
            team.CreatedTime = DateTime.UtcNow;

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();
            return Ok(team);
        }

        [HttpPost("{teamId}/members/{userId}")]
        public async Task<IActionResult> AddMember(Guid teamId, Guid userId)
        {
            var currentUserId = GetCurrentUserId();
            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return NotFound();
            if (team.OwnerId != currentUserId) return Forbid();

            var userToAdd = await _context.Users.FindAsync(userId);
            if (userToAdd == null) return NotFound();

            if (!team.Members.Any(m => m.Id == userId))
            {
                team.Members.Add(userToAdd);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true });
        }

        [HttpDelete("{teamId}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
        {
            var currentUserId = GetCurrentUserId();
            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return NotFound();
            if (team.OwnerId != currentUserId && currentUserId != userId) return Forbid();

            var memberToRemove = team.Members.FirstOrDefault(m => m.Id == userId);
            if (memberToRemove != null)
            {
                team.Members.Remove(memberToRemove);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true });
        }

        [HttpPost("{teamId}/transfer-ownership/{newOwnerId}")]
        public async Task<IActionResult> TransferOwnership(Guid teamId, Guid newOwnerId)
        {
            var currentUserId = GetCurrentUserId();
            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return NotFound();
            if (team.OwnerId != currentUserId) return Forbid();

            var newOwner = await _context.Users.FindAsync(newOwnerId);
            if (newOwner == null) return NotFound();

            team.OwnerId = newOwnerId;

            if (!team.Members.Any(m => m.Id == newOwnerId))
            {
                team.Members.Add(newOwner);
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
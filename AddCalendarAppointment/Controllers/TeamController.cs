using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace AddCalendarAppointment.Controllers
{
    public class TeamController : Controller
    {
        private readonly ApplicationDbContext _context;

        public TeamController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Action xử lý khi bấm vào nút "My teams"
        public IActionResult Manage()
        {
            // 1. Kiểm tra xem người dùng đã đăng nhập chưa bằng cách lấy UserId từ Session
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr))
            {
                return RedirectToAction("Index", "Account"); // Chưa đăng nhập thì đuổi về trang Login
            }

            Guid userId = Guid.Parse(userIdStr);

            // 2. Tìm các Team mà người dùng này đang là thành viên
            // Dùng .Include(t => t.Members) để đếm được số lượng thành viên trong View
            var myTeams = _context.Teams
                .Include(t => t.Members)
                .Where(t => t.Members.Any(m => m.Id == userId))
                .ToList();

            // 3. Trả danh sách Team về cho View hiển thị
            return View(myTeams);
        }

        [HttpGet]
        public async Task<IActionResult> GetTeamDetails(Guid teamId)
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            Guid currentUserId = Guid.Parse(userIdStr);

            var team = await _context.Teams
                .Include(t => t.Members)
                .Include(t => t.Appointments)
                    .ThenInclude(a => a.Owner)
                .Include(t => t.Appointments)
                    .ThenInclude(a => a.Guests)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return NotFound();

            var membersList = team.Members.Select(m => new {
                id = m.Id,
                username = m.Username,
                email = m.Email,
                role = (m.Id == team.OwnerId) ? "Trưởng nhóm" : "Thành viên"
            }).OrderBy(m => m.role == "Trưởng nhóm" ? 0 : 1).ToList();

            // Lấy danh sách các cuộc họp Group Meeting của Team này (Chỉ lấy các cuộc họp trong tương lai)
            var now = DateTime.Now;
            var groupMeetings = team.Appointments
                .Where(a => a.Visibility == VisibilityType.Public && a.EndTime > now && !a.IsDeleted)
                .OrderBy(a => a.StartTime)
                .Select(a => new {
                    id = a.Id,
                    title = a.Title,
                    description = a.Description,
                    location = a.Location,
                    startTime = a.StartTime.ToString("dd/MM/yyyy HH:mm"),
                    endTime = a.EndTime.ToString("dd/MM/yyyy HH:mm"),
                    color = a.ColorCategory ?? "#039be5",
                    creatorName = a.Owner.Username,
                    creatorId = a.OwnerId,
                    ownerEmail = a.Owner.Email,
                    notification = a.Notification ?? "30 minutes before",
                    isJoined = a.Guests != null && a.Guests.Any(g => g.UserId == currentUserId),
                    participants = (a.Guests != null 
                        ? new[] { a.Owner.Email }.Concat(a.Guests.Select(g => g.User.Email)).Distinct().ToList()
                        : new List<string> { a.Owner.Email })
                }).ToList();

            return Json(new
            {
                teamName = team.Name,
                currentUserId = currentUserId,
                ownerId = team.OwnerId,
                members = membersList,
                groupMeetings = groupMeetings
            });
        }

        // 2. Logic tạo nhóm mới
        [HttpPost]
        public async Task<IActionResult> CreateTeam(string teamName, string description, string memberEmails)
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return RedirectToAction("Index", "Account");
            Guid userId = Guid.Parse(userIdStr);

            var currentUser = await _context.Users.FindAsync(userId);

            var newTeam = new Team
            {
                Name = teamName,
                Description = description,
                OwnerId = userId,
                CreatedTime = DateTime.UtcNow,
                Members = new List<User>()
            };

            // Người tạo tự động trở thành thành viên của nhóm
            newTeam.Members.Add(currentUser);

            if (!string.IsNullOrWhiteSpace(memberEmails))
            {
                // Tách chuỗi email bằng dấu phẩy, cắt khoảng trắng và loại bỏ các chuỗi rỗng
                var emailList = memberEmails.Split(',')
                                            .Select(e => e.Trim())
                                            .Where(e => !string.IsNullOrEmpty(e))
                                            .ToList();

                // Tìm các User trong DB có Email khớp với danh sách vừa nhập
                var invitedUsers = await _context.Users
                                                 .Where(u => emailList.Contains(u.Email))
                                                 .ToListAsync();

                // Thêm các user tìm thấy vào nhóm
                foreach (var user in invitedUsers)
                {
                    // Kiểm tra để tránh thêm trùng người tạo (nếu họ tự gõ email của chính mình)
                    if (user.Id != currentUser.Id && !newTeam.Members.Any(m => m.Id == user.Id))
                    {
                        newTeam.Members.Add(user);
                    }
                }
            }

            _context.Teams.Add(newTeam);
            await _context.SaveChangesAsync();

            return RedirectToAction("Manage"); // Load lại trang để thấy nhóm mới
        }

        // 3. Logic rời nhóm (Có tự động chuyển quyền)
        [HttpPost]
        public async Task<IActionResult> LeaveTeam(Guid teamId)
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return Json(new { success = false, message = "Chưa đăng nhập" });
            Guid userId = Guid.Parse(userIdStr);

            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return Json(new { success = false, message = "Không tìm thấy nhóm" });

            var member = team.Members.FirstOrDefault(m => m.Id == userId);
            if (member == null) return Json(new { success = false, message = "Bạn không phải thành viên nhóm này" });

            // XỬ LÝ NẾU NGƯỜI RỜI ĐI LÀ TRƯỞNG NHÓM
            if (team.OwnerId == userId)
            {
                // Tìm các thành viên còn lại (trừ ông trưởng nhóm đang đòi rời đi)
                var remainingMembers = team.Members.Where(m => m.Id != userId).ToList();

                if (remainingMembers.Any())
                {
                    // Lấy ngẫu nhiên 1 người còn lại lên làm Trưởng nhóm mới
                    team.OwnerId = remainingMembers.First().Id;
                }
                else
                {
                    // Nếu nhóm không còn ai khác, xóa luôn nhóm để tránh rác Database
                    _context.Teams.Remove(team);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = "Đã rời và giải tán nhóm vì không còn ai." });
                }
            }

            // Xóa user hiện tại khỏi nhóm
            team.Members.Remove(member);
            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }

        // 4. Logic Thêm thành viên vào nhóm ĐÃ TỒN TẠI
        [HttpPost]
        public async Task<IActionResult> AddMembersToExistingTeam(Guid teamId, string memberEmails)
        {
            var currentUserId = Guid.Parse(HttpContext.Session.GetString("UserId"));

            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return Json(new { success = false, message = "Không tìm thấy nhóm." });

            if (team.OwnerId != currentUserId)
                return Json(new { success = false, message = "Chỉ trưởng nhóm mới được thêm thành viên!" });

            if (!string.IsNullOrWhiteSpace(memberEmails))
            {
                var emailList = memberEmails.Split(',').Select(e => e.Trim()).Where(e => !string.IsNullOrEmpty(e)).ToList();
                var usersToAdd = await _context.Users.Where(u => emailList.Contains(u.Email)).ToListAsync();

                int addedCount = 0;
                foreach (var user in usersToAdd)
                {
                    if (!team.Members.Any(m => m.Id == user.Id))
                    {
                        team.Members.Add(user);
                        addedCount++;
                    }
                }
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Đã thêm {addedCount} thành viên mới." });
            }
            return Json(new { success = false, message = "Vui lòng nhập email hợp lệ." });
        }

        // 5. Logic Chuyển quyền trưởng nhóm
        [HttpPost]
        public async Task<IActionResult> TransferOwnership(Guid teamId, string newOwnerEmail)
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return Json(new { success = false, message = "Lỗi xác thực." });
            Guid currentUserId = Guid.Parse(userIdStr);

            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return Json(new { success = false, message = "Không tìm thấy nhóm." });

            // Kiểm tra xem người đang thao tác có phải là trưởng nhóm không
            if (team.OwnerId != currentUserId)
                return Json(new { success = false, message = "Chỉ trưởng nhóm mới có quyền chuyển giao." });

            // Tìm user mới qua email
            var newOwner = await _context.Users.FirstOrDefaultAsync(u => u.Email == newOwnerEmail.Trim());
            if (newOwner == null)
                return Json(new { success = false, message = "Không tìm thấy người dùng với email này trên hệ thống." });

            // Cập nhật OwnerId
            team.OwnerId = newOwner.Id;

            // Nếu người mới chưa nằm trong nhóm, tự động thêm vào nhóm luôn
            if (!team.Members.Any(m => m.Id == newOwner.Id))
            {
                team.Members.Add(newOwner);
            }

            await _context.SaveChangesAsync();
            return Json(new { success = true });
        }

        // 6. Logic Xóa thành viên (Chỉ trưởng nhóm mới được dùng)
        [HttpPost]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid memberId)
        {
            var currentUserId = Guid.Parse(HttpContext.Session.GetString("UserId"));

            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return Json(new { success = false, message = "Không tìm thấy nhóm." });

            // KIỂM TRA QUYỀN: Ai không phải trưởng nhóm thì từ chối
            if (team.OwnerId != currentUserId)
                return Json(new { success = false, message = "Chỉ trưởng nhóm mới có quyền xóa thành viên." });

            // Trưởng nhóm không thể tự xóa chính mình bằng nút này
            if (memberId == team.OwnerId)
                return Json(new { success = false, message = "Không thể xóa trưởng nhóm." });

            var memberToRemove = team.Members.FirstOrDefault(m => m.Id == memberId);
            if (memberToRemove != null)
            {
                team.Members.Remove(memberToRemove);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Đã xóa thành viên khỏi nhóm." });
            }

            return Json(new { success = false, message = "Không tìm thấy thành viên này trong nhóm." });
        }

        // 7. Logic Xóa nhóm (Chỉ trưởng nhóm mới được dùng)
        [HttpPost]
        public async Task<IActionResult> DeleteTeam(Guid teamId)
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return Json(new { success = false, message = "Lỗi xác thực." });
            Guid currentUserId = Guid.Parse(userIdStr);

            var team = await _context.Teams
                .Include(t => t.Appointments)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return Json(new { success = false, message = "Không tìm thấy nhóm." });

            if (team.OwnerId != currentUserId)
                return Json(new { success = false, message = "Chỉ trưởng nhóm mới có quyền xóa nhóm." });

            // Xóa nhóm
            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }
    }
}
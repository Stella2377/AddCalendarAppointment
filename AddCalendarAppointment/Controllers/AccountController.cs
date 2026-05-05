using AddCalendarAppointment.Data;
using AddCalendarAppointment.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace AddCalendarAppointment.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }

        // View hiển thị 2 tab đăng nhập/đăng ký
        public IActionResult Index()
        {
            // Nếu đã đăng nhập thì chuyển luôn vào trang chủ/calendar
            if (HttpContext.Session.GetString("UserId") != null)
            {
                return RedirectToAction("Index", "Home");
            }
            return View();
        }
        [HttpPost]
        public IActionResult Register(string username, string email, string password)
        {
            // Kiểm tra xem Email đã tồn tại chưa
            if (_context.Users.Any(u => u.Email == email))
            {
                return Json(new { success = false, message = "Email này đã được đăng ký!" });
            }

            // Kiểm tra Username tồn tại (tuỳ chọn, để tránh trùng tên hiển thị)
            if (_context.Users.Any(u => u.Username == username))
            {
                return Json(new { success = false, message = "Tên hiển thị này đã có người dùng!" });
            }

            // Tạo user mới
            var user = new User
            {
                Username = username, // Tên để hiển thị trong app
                Email = email,       // Dùng email này để đăng nhập
                Password = password
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Json(new { success = true });
        }

        [HttpPost]
        public IActionResult Login(string email, string password) // Đổi từ username sang email
        {
            // Tìm User dựa trên EMAIL và Password
            var user = _context.Users.FirstOrDefault(u => u.Email == email && u.Password == password);

            if (user != null)
            {
                // Lưu session khi đăng nhập thành công
                // 1. Lưu UserId để kiểm tra quyền truy cập
                HttpContext.Session.SetString("UserId", user.Id.ToString());

                // 2. Lưu thêm Email hoặc Username để hiển thị lên Header
                HttpContext.Session.SetString("UserEmail", user.Email);
                return Json(new { success = true });
            }

            return Json(new { success = false, message = "Sai Email hoặc mật khẩu!" });
        }

        [HttpPost]
        public IActionResult ChangePassword(string oldPassword, string newPassword, string confirmPassword)
        {
            // 1. Kiểm tra đăng nhập
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập lại để thực hiện!" });
            }

            // 2. Kiểm tra mật khẩu mới và xác nhận
            if (newPassword != confirmPassword)
            {
                return Json(new { success = false, message = "Mật khẩu xác nhận không khớp!" });
            }

            // 3. Tìm user trong database
            Guid userId = Guid.Parse(userIdStr);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            // 4. Kiểm tra mật khẩu cũ
            if (user == null || user.Password != oldPassword)
            {
                return Json(new { success = false, message = "Mật khẩu cũ không chính xác!" });
            }

            // 5. Cập nhật mật khẩu mới và lưu database
            user.Password = newPassword;
            _context.SaveChanges();

            return Json(new { success = true, message = "Đổi mật khẩu thành công!" });
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Account");
        }
    }
}
using AddCalendarAppointment.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace AddCalendarAppointment.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            // Kiểm tra xem đã đăng nhập chưa
            if (HttpContext.Session.GetString("UserId") == null)
            {
                // Nếu chưa, bắt buộc quay về trang đăng nhập
                return RedirectToAction("Index", "Account");
            }

            // Nếu đã đăng nhập, hiển thị giao diện Calendar
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}

using EdControl.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _db;

    public HomeController(AppDbContext db) => _db = db;

    public async Task<IActionResult> Index()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");

        var students = await _db.Students.CountAsync();
        var groups = await _db.Groups.CountAsync();
        var lessons = await _db.Lessons.CountAsync();
        var total = await _db.AttendanceRecords.CountAsync();
        var present = await _db.AttendanceRecords
            .CountAsync(a => a.Status == "present" || a.Status == "late");
        var rate = total > 0 ? (int)Math.Round((double)present / total * 100) : 0;

        var recentLessons = await _db.Lessons
            .Include(l => l.Group)
            .Include(l => l.Subject)
            .OrderByDescending(l => l.Date)
            .Take(5)
            .ToListAsync();

        ViewBag.Students = students;
        ViewBag.Groups = groups;
        ViewBag.Lessons = lessons;
        ViewBag.Rate = rate;
        ViewBag.RecentLessons = recentLessons;

        return View();
    }
}

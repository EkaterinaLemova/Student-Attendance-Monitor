using EdControl.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class ReportsController : Controller
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    private IActionResult CheckAuth()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");
        return null!;
    }

    public async Task<IActionResult> Index(int? groupId, int? subjectId)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name", groupId);
        ViewBag.Subjects = new SelectList(await _db.Subjects.ToListAsync(), "Id", "Name", subjectId);

        if (!groupId.HasValue) return View();

        var group = await _db.Groups.FindAsync(groupId);
        var lessonsQuery = _db.Lessons.Include(l => l.Subject).Where(l => l.GroupId == groupId);
        if (subjectId.HasValue) lessonsQuery = lessonsQuery.Where(l => l.SubjectId == subjectId);
        var lessons = await lessonsQuery.OrderBy(l => l.Date).ToListAsync();

        var students = await _db.Students.Where(s => s.GroupId == groupId).OrderBy(s => s.LastName).ToListAsync();

        var lessonIds = lessons.Select(l => l.Id).ToList();
        var records = await _db.AttendanceRecords
            .Where(a => lessonIds.Contains(a.LessonId))
            .ToListAsync();

        ViewBag.Group = group;
        ViewBag.Lessons = lessons;
        ViewBag.Students = students;
        ViewBag.Records = records;

        return View();
    }
}

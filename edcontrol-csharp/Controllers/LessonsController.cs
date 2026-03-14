using EdControl.Data;
using EdControl.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class LessonsController : Controller
{
    private readonly AppDbContext _db;
    public LessonsController(AppDbContext db) => _db = db;

    private IActionResult CheckAuth()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");
        return null!;
    }

    public async Task<IActionResult> Index()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var lessons = await _db.Lessons
            .Include(l => l.Group)
            .Include(l => l.Subject).ThenInclude(s => s!.Teacher)
            .OrderByDescending(l => l.Date)
            .ToListAsync();
        return View(lessons);
    }

    [HttpGet]
    public async Task<IActionResult> Create()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name");
        ViewBag.Subjects = new SelectList(await _db.Subjects.ToListAsync(), "Id", "Name");
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(Lesson lesson)
    {
        _db.Lessons.Add(lesson);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var lesson = await _db.Lessons.FindAsync(id);
        if (lesson == null) return NotFound();
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name", lesson.GroupId);
        ViewBag.Subjects = new SelectList(await _db.Subjects.ToListAsync(), "Id", "Name", lesson.SubjectId);
        return View(lesson);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(Lesson lesson)
    {
        _db.Lessons.Update(lesson);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var l = await _db.Lessons.FindAsync(id);
        if (l != null) { _db.Lessons.Remove(l); await _db.SaveChangesAsync(); }
        return RedirectToAction("Index");
    }

    public async Task<IActionResult> Attendance(int id)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var lesson = await _db.Lessons
            .Include(l => l.Group).ThenInclude(g => g!.Students)
            .Include(l => l.Subject)
            .Include(l => l.AttendanceRecords)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (lesson == null) return NotFound();
        return View(lesson);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAttendance(int lessonId, List<int> studentIds, List<string> statuses, List<string?> notes)
    {
        for (int i = 0; i < studentIds.Count; i++)
        {
            var existing = await _db.AttendanceRecords
                .FirstOrDefaultAsync(a => a.LessonId == lessonId && a.StudentId == studentIds[i]);
            if (existing != null)
            {
                existing.Status = statuses[i];
                existing.Note = notes.Count > i ? notes[i] : null;
            }
            else
            {
                _db.AttendanceRecords.Add(new AttendanceRecord
                {
                    LessonId = lessonId,
                    StudentId = studentIds[i],
                    Status = statuses[i],
                    Note = notes.Count > i ? notes[i] : null
                });
            }
        }
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }
}

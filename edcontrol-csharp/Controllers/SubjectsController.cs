using EdControl.Data;
using EdControl.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class SubjectsController : Controller
{
    private readonly AppDbContext _db;
    public SubjectsController(AppDbContext db) => _db = db;

    private IActionResult CheckAuth()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");
        return null!;
    }

    public async Task<IActionResult> Index()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var subjects = await _db.Subjects.Include(s => s.Teacher).ToListAsync();
        return View(subjects);
    }

    [HttpGet]
    public async Task<IActionResult> Create()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        ViewBag.Teachers = new SelectList(await _db.Users.ToListAsync(), "Id", "FullName");
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(Subject subject)
    {
        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null) return NotFound();
        ViewBag.Teachers = new SelectList(await _db.Users.ToListAsync(), "Id", "FullName", subject.TeacherId);
        return View(subject);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(Subject subject)
    {
        _db.Subjects.Update(subject);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _db.Subjects.FindAsync(id);
        if (s != null) { _db.Subjects.Remove(s); await _db.SaveChangesAsync(); }
        return RedirectToAction("Index");
    }
}

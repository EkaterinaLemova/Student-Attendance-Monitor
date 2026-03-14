using EdControl.Data;
using EdControl.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class StudentsController : Controller
{
    private readonly AppDbContext _db;
    public StudentsController(AppDbContext db) => _db = db;

    private IActionResult CheckAuth()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");
        return null!;
    }

    public async Task<IActionResult> Index(int? groupId)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var query = _db.Students.Include(s => s.Group).AsQueryable();
        if (groupId.HasValue) query = query.Where(s => s.GroupId == groupId);
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name");
        ViewBag.GroupId = groupId;
        return View(await query.OrderBy(s => s.LastName).ToListAsync());
    }

    [HttpGet]
    public async Task<IActionResult> Create()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name");
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(Student student)
    {
        _db.Students.Add(student);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var student = await _db.Students.FindAsync(id);
        if (student == null) return NotFound();
        ViewBag.Groups = new SelectList(await _db.Groups.ToListAsync(), "Id", "Name", student.GroupId);
        return View(student);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(Student student)
    {
        _db.Students.Update(student);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _db.Students.FindAsync(id);
        if (s != null) { _db.Students.Remove(s); await _db.SaveChangesAsync(); }
        return RedirectToAction("Index");
    }
}

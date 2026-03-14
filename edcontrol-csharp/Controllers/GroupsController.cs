using EdControl.Data;
using EdControl.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Controllers;

public class GroupsController : Controller
{
    private readonly AppDbContext _db;
    public GroupsController(AppDbContext db) => _db = db;

    private IActionResult CheckAuth()
    {
        if (HttpContext.Session.GetString("UserId") == null)
            return RedirectToAction("Login", "Account");
        return null!;
    }

    public async Task<IActionResult> Index()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var groups = await _db.Groups.Include(g => g.Students).ToListAsync();
        return View(groups);
    }

    [HttpGet]
    public IActionResult Create()
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(Group group)
    {
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var auth = CheckAuth(); if (auth != null) return auth;
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        return View(group);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(Group group)
    {
        _db.Groups.Update(group);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var group = await _db.Groups.FindAsync(id);
        if (group != null) { _db.Groups.Remove(group); await _db.SaveChangesAsync(); }
        return RedirectToAction("Index");
    }
}

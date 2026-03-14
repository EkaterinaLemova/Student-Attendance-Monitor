using EdControl.Models;
using Microsoft.EntityFrameworkCore;

namespace EdControl.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Subject> Subjects { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Group>().ToTable("Groups");
        modelBuilder.Entity<Student>().ToTable("Students");
        modelBuilder.Entity<Subject>().ToTable("Subjects");
        modelBuilder.Entity<Lesson>().ToTable("Lessons");
        modelBuilder.Entity<AttendanceRecord>().ToTable("AttendanceRecords");

        modelBuilder.Entity<Student>()
            .HasOne(s => s.Group)
            .WithMany(g => g.Students)
            .HasForeignKey(s => s.GroupId);

        modelBuilder.Entity<Subject>()
            .HasOne(s => s.Teacher)
            .WithMany(u => u.Subjects)
            .HasForeignKey(s => s.TeacherId);

        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Group)
            .WithMany(g => g.Lessons)
            .HasForeignKey(l => l.GroupId);

        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Subject)
            .WithMany(s => s.Lessons)
            .HasForeignKey(l => l.SubjectId);

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(a => a.Lesson)
            .WithMany(l => l.AttendanceRecords)
            .HasForeignKey(a => a.LessonId);

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(a => a.Student)
            .WithMany(s => s.AttendanceRecords)
            .HasForeignKey(a => a.StudentId);

        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Username = "admin", Password = "admin123", FullName = "Администратор", Role = "admin" },
            new User { Id = 2, Username = "ivanova", Password = "teacher123", FullName = "Иванова Мария Петровна", Role = "teacher" },
            new User { Id = 3, Username = "petrov", Password = "teacher123", FullName = "Петров Сергей Иванович", Role = "teacher" }
        );

        modelBuilder.Entity<Group>().HasData(
            new Group { Id = 1, Name = "ИС-21", Specialty = "Информационные системы", Year = 2021 },
            new Group { Id = 2, Name = "ПО-22", Specialty = "Программное обеспечение", Year = 2022 },
            new Group { Id = 3, Name = "СА-21", Specialty = "Системный анализ", Year = 2021 }
        );
    }
}

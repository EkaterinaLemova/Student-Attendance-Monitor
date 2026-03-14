namespace EdControl.Models;

public class AttendanceRecord
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public Lesson? Lesson { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public string Status { get; set; } = "present";
    public string? Note { get; set; }
}

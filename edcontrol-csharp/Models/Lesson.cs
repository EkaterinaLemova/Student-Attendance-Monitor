namespace EdControl.Models;

public class Lesson
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string? Topic { get; set; }
    public string LessonType { get; set; } = "lecture";
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public int SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}

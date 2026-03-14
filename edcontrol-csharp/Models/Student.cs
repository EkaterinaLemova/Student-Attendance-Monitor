namespace EdControl.Models;

public class Student
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string? StudentNumber { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

    public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();
}

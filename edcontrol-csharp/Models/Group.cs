namespace EdControl.Models;

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public int Year { get; set; }
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

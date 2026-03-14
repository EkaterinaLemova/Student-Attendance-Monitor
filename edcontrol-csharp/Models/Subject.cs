namespace EdControl.Models;

public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public User? Teacher { get; set; }
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

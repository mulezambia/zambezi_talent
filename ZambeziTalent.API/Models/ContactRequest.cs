public class ContactRequest
{
    public int Id { get; set; }
    public string ScoutEmail { get; set; } = "";
    public string ScoutName { get; set; } = "";
    public string ScoutPhone { get; set; } = ""; // <-- ADD THIS
    public string TalentEmail { get; set; } = "";
    public string TalentName { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
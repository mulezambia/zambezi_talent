namespace ZambeziTalent.API.Models;
public class TrialInvite
{
    public int Id { get; set; }
    public string ScoutEmail { get; set; } = "";
    public string ScoutName { get; set; } = "";
    public string TalentEmail { get; set; } = "";
    public string TalentName { get; set; } = "";
    public string TrialDate { get; set; } = ""; // e.g 2026-11-15
    public string TrialTime { get; set; } = ""; // e.g 10:00
    public string Location { get; set; } = ""; // e.g Heroes Stadium, Lusaka
    public string Message { get; set; } = "";
    public string Status { get; set; } = "Pending"; // Pending / Accepted / Declined
    public DateTime CreatedAt { get; set; }
}
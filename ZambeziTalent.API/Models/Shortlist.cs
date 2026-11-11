namespace ZambeziTalent.API.Models;

public class Shortlist
{
    public int Id { get; set; }
    public string ScoutEmail { get; set; } = "";
    public int TalentId { get; set; }
    public string TalentName { get; set; } = "";
    public string TalentPosition { get; set; } = "";
    public string TalentProvince { get; set; } = "";
}
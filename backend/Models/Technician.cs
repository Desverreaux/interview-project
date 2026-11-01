namespace Backend.Models;

/// <summary>
/// A staff profile that can be selected as the assignee or author of ticket notes.
/// </summary>
public sealed class Technician
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsDefault { get; set; }

    /// <summary>Teams this technician belongs to, represented by join entities.</summary>
    public ICollection<TechnicianTeam> TeamMemberships { get; set; } =
        new List<TechnicianTeam>();

    /// <summary>Tickets currently assigned to this technician.</summary>
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
}

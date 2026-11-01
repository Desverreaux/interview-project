namespace Backend.Models;

/// <summary>
/// A support team that technicians can join and tickets can be assigned to.
/// </summary>
public sealed class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Technicians in this team, through the many-to-many join entity.</summary>
    public ICollection<TechnicianTeam> TechnicianMemberships { get; set; } =
        new List<TechnicianTeam>();

    /// <summary>Tickets assigned to this team.</summary>
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}

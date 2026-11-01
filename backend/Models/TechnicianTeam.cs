namespace Backend.Models;

/// <summary>
/// Join entity linking one technician to one team in the many-to-many relationship.
/// The technician and team IDs form the composite key configured in the DbContext.
/// </summary>
public sealed class TechnicianTeam
{
    public int TechnicianId { get; set; }
    public Technician Technician { get; set; } = null!;
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
}

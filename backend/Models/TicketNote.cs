namespace Backend.Models;

/// <summary>
/// A comment attached to a ticket and attributed to the technician who added it.
/// </summary>
public sealed class TicketNote
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    public string Content { get; set; } = string.Empty;

    /// <summary>UTC time assigned by the API when the note is created.</summary>
    public DateTimeOffset CreatedAt { get; set; }
    public int TechnicianId { get; set; }
    public Technician Technician { get; set; } = null!;
}

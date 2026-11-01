namespace Backend.Models;

/// <summary>
/// Persisted support request, including its assignment and the notes recorded on it.
/// </summary>
public sealed class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterImage { get; set; } = string.Empty;

    /// <summary>UTC time when the ticket was created.</summary>
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastMessageAt { get; set; }

    /// <summary>UTC deadline for the initial response.</summary>
    public DateTimeOffset ResponseDueAt { get; set; }

    /// <summary>One of the priority values accepted by the ticket API.</summary>
    public string Priority { get; set; } = string.Empty;

    /// <summary>One of the workflow statuses accepted by the ticket API.</summary>
    public string Status { get; set; } = string.Empty;
    public bool IsFavorite { get; set; }

    /// <summary>The assigned technician; that technician must belong to <see cref="TeamId"/>.</summary>
    public int AssignedTechnicianId { get; set; }
    public Technician AssignedTechnician { get; set; } = null!;

    /// <summary>The team responsible for this ticket and compatible with its assignee.</summary>
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;

    /// <summary>Notes associated with this ticket, in the EF relationship.</summary>
    public ICollection<TicketNote> Notes { get; set; } = new List<TicketNote>();
}

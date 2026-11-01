namespace Backend.Models;

/// <summary>
/// Note API shape with the author's display name included for the conversation view.
/// </summary>
public sealed record TicketNoteResponse(
    int Id,
    int TicketId,
    string Content,
    DateTimeOffset CreatedAt,
    int TechnicianId,
    string TechnicianName
);

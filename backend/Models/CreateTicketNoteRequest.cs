namespace Backend.Models;

/// <summary>
/// Client input for a note; the API validates its content and assigns the creation time.
/// </summary>
public sealed class CreateTicketNoteRequest
{
    public string? Content { get; set; }

    /// <summary>The demo technician credited as the note author.</summary>
    public int? TechnicianId { get; set; }
}

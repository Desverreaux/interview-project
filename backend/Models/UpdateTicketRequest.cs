namespace Backend.Models;

/// <summary>
/// Proposed ticket edits; the API validates the full update and assignment relationship.
/// </summary>
public sealed class UpdateTicketRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public int? AssignedTechnicianId { get; set; }
    public int? TeamId { get; set; }
}

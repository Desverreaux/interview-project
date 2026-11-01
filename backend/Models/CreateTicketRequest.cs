namespace Backend.Models;

/// <summary>
/// Client input for creating a ticket; the API trims and validates the supplied values.
/// </summary>
public sealed class CreateTicketRequest
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? RequesterName { get; init; }
    public string? Priority { get; init; }

    /// <summary>
    /// Optional team choice; the API infers it only when the default technician has one team.
    /// </summary>
    public int? TeamId { get; init; }
}

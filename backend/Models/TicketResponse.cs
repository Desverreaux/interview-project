namespace Backend.Models;

/// <summary>
/// Ticket API shape with technician and team names flattened for client display.
/// </summary>
public sealed record TicketResponse(
    int Id,
    string Title,
    string Description,
    string RequesterName,
    string RequesterImage,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastMessageAt,
    DateTimeOffset ResponseDueAt,
    string Priority,
    string Status,
    bool IsFavorite,
    int AssignedTechnicianId,
    string AssignedTechnicianName,
    int TeamId,
    string TeamName
);

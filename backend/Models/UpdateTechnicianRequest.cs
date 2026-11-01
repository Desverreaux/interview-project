namespace Backend.Models;

/// <summary>
/// Proposed profile edits; TeamIds represents the technician's complete desired membership set.
/// </summary>
public sealed class UpdateTechnicianRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public List<int>? TeamIds { get; set; }
    public bool? IsAvailable { get; set; }
}

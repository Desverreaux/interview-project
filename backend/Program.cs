using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var databaseFolder = Path.Combine(
    builder.Environment.ContentRootPath,
    "App_Data"
);
Directory.CreateDirectory(databaseFolder);

// Anchor SQLite to the app's content directory so its location does not depend on launch cwd.
var databaseFile = Path.Combine(databaseFolder, "tickets.db");

builder.Services.AddDbContext<TicketDbContext>(options =>
    options.UseSqlite($"Data Source={databaseFile}"));

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TicketDbContext>();

    // Seed demo tickets once; later starts must preserve the stored ticket data.
    if (!await dbContext.Tickets.AnyAsync())
    {
        dbContext.Tickets.AddRange(TicketGenerator.GenerateTickets());
        await dbContext.SaveChangesAsync();
    }
}

app.MapGet("/api/hello", () => new
{
    message = "Hello from ASP.NET Core!",
    timestamp = DateTime.UtcNow
});

// Ticket and technician endpoints return UI-focused shapes instead of EF entity graphs.
app.MapGet("/api/tickets", async (TicketDbContext dbContext) =>
{
    var tickets = await dbContext.Tickets
        .AsNoTracking()
        .Include(ticket => ticket.AssignedTechnician)
        .Include(ticket => ticket.Team)
        .ToListAsync();

    // SQLite cannot translate ordering by DateTimeOffset, so sort this small result set in memory.
    return tickets
        .Select(ToTicketResponse)
        .OrderByDescending(ticket => ticket.CreatedAt)
        .ToList();
});

app.MapGet("/api/tickets/{id:int}", GetTicketByIdAsync);
app.MapGet("/api/tickets/{id:int}/notes", GetTicketNotesAsync);
app.MapPost("/api/tickets", CreateTicketAsync);
app.MapPost("/api/tickets/{id:int}/notes", CreateTicketNoteAsync);
app.MapPut("/api/tickets/{id:int}", UpdateTicketAsync);
app.MapGet("/api/technicians", async (TicketDbContext dbContext) =>
{
    var technicians = await dbContext.Technicians
        .AsNoTracking()
        .Include(technician => technician.TeamMemberships)
        .ThenInclude(membership => membership.Team)
        .OrderBy(technician => technician.Id)
        .ToListAsync();

    return technicians.Select(technician =>
    {
        var teams = technician.TeamMemberships
            .OrderBy(membership => membership.Team.Name)
            .Select(membership => membership.Team)
            .ToList();

        return new
        {
            technician.Id,
            technician.Name,
            technician.Email,
            technician.Role,
            technician.IsAvailable,
            technician.IsDefault,
            TeamIds = teams.Select(team => team.Id).ToList(),
            TeamNames = teams.Select(team => team.Name).ToList(),
            TeamName = string.Join(", ", teams.Select(team => team.Name))
        };
    }).ToList();
});
app.MapGet("/api/teams", async (TicketDbContext dbContext) =>
    await dbContext.Teams
        .AsNoTracking()
        .OrderBy(team => team.Name)
        .Select(team => new { team.Id, team.Name })
        .ToListAsync()
);
app.MapPut("/api/technicians/{id:int}", UpdateTechnicianAsync);

// This interview demo has no authentication; do not use it with sensitive ticket data.
app.Run();

static async Task<IResult> GetTicketByIdAsync(int id, TicketDbContext dbContext)
{
    var ticket = await dbContext.Tickets
        .AsNoTracking()
        .Include(currentTicket => currentTicket.AssignedTechnician)
        .Include(currentTicket => currentTicket.Team)
        .FirstOrDefaultAsync(currentTicket => currentTicket.Id == id);

    if (ticket is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(ToTicketResponse(ticket));
}

static async Task<IResult> GetTicketNotesAsync(
    int id,
    TicketDbContext dbContext
)
{
    if (!await dbContext.Tickets.AnyAsync(ticket => ticket.Id == id))
    {
        return Results.NotFound();
    }

    var notes = await dbContext.TicketNotes
        .AsNoTracking()
        .Where(note => note.TicketId == id)
        .Include(note => note.Technician)
        // Integer IDs preserve insertion order and avoid SQLite DateTimeOffset ordering limits.
        .OrderByDescending(note => note.Id)
        .ToListAsync();

    return Results.Ok(notes.Select(ToTicketNoteResponse).ToList());
}

static async Task<IResult> CreateTicketNoteAsync(
    int id,
    CreateTicketNoteRequest request,
    TicketDbContext dbContext
)
{
    // Attribute the note to the selected demo technician and set its timestamp on the server.
    if (!await dbContext.Tickets.AnyAsync(ticket => ticket.Id == id))
    {
        return Results.NotFound();
    }

    var errors = new Dictionary<string, string[]>();
    var content = request.Content?.Trim() ?? string.Empty;

    if (content.Length == 0)
    {
        errors[nameof(request.Content)] = ["Note content is required."];
    }
    else if (content.Length > 2000)
    {
        errors[nameof(request.Content)] =
            ["Note content cannot exceed 2000 characters."];
    }

    var technician = request.TechnicianId.HasValue
        ? await dbContext.Technicians.FirstOrDefaultAsync(currentTechnician =>
            currentTechnician.Id == request.TechnicianId.Value
        )
        : null;

    if (technician is null)
    {
        errors[nameof(request.TechnicianId)] =
            ["Choose an existing technician to attribute this note to."];
    }

    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var note = new TicketNote
    {
        TicketId = id,
        Content = content,
        CreatedAt = DateTimeOffset.UtcNow,
        TechnicianId = technician!.Id,
        Technician = technician
    };

    dbContext.TicketNotes.Add(note);
    await dbContext.SaveChangesAsync();

    return Results.Created(
        $"/api/tickets/{id}/notes",
        ToTicketNoteResponse(note)
    );
}

static async Task<IResult> CreateTicketAsync(
    CreateTicketRequest request,
    TicketDbContext dbContext
)
{
    var errors = new Dictionary<string, string[]>();
    var title = request.Title?.Trim() ?? string.Empty;
    var description = request.Description?.Trim() ?? string.Empty;
    var priorities = new[] { "Low", "Medium", "High", "Urgent" };
    var priority = priorities.FirstOrDefault(
        option => string.Equals(
            option,
            request.Priority?.Trim(),
            StringComparison.OrdinalIgnoreCase
        )
    );

    if (title.Length == 0)
    {
        errors[nameof(request.Title)] = ["Title is required."];
    }

    if (description.Length == 0)
    {
        errors[nameof(request.Description)] = ["Description is required."];
    }

    if (priority is null)
    {
        errors[nameof(request.Priority)] =
            ["Priority must be Low, Medium, High, or Urgent."];
    }

    if (title.Length == 0 || description.Length == 0 || priority is null)
    {
        return Results.ValidationProblem(errors);
    }

    var defaultTechnician = await dbContext.Technicians
        .Include(technician => technician.TeamMemberships)
        .ThenInclude(membership => membership.Team)
        .FirstOrDefaultAsync(technician => technician.IsDefault);

    if (defaultTechnician is null)
    {
        return Results.Problem(
            "A default technician must be configured before creating tickets.",
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }

    var defaultTechnicianTeamIds = defaultTechnician.TeamMemberships
        .Select(membership => membership.TeamId)
        .ToList();

    if (defaultTechnicianTeamIds.Count == 0)
    {
        return Results.Problem(
            "The default technician must belong to a team before creating tickets.",
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }

    // A sole team can be inferred; multiple memberships require an explicit choice.
    var teamId = request.TeamId;
    if (!teamId.HasValue && defaultTechnicianTeamIds.Count == 1)
    {
        teamId = defaultTechnicianTeamIds[0];
    }

    if (!teamId.HasValue)
    {
        errors[nameof(request.TeamId)] =
            ["Choose a team for this ticket."];
    }
    else if (!defaultTechnicianTeamIds.Contains(teamId.Value))
    {
        errors[nameof(request.TeamId)] =
            ["Choose a team that the default technician belongs to."];
    }

    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var assignedTeam = defaultTechnician.TeamMemberships
        .First(membership => membership.TeamId == teamId!.Value)
        .Team;

    var now = DateTimeOffset.UtcNow;
    var faker = new Bogus.Faker();
    var ticket = new Ticket
    {
        Title = title,
        Description = description,
        RequesterName = string.IsNullOrWhiteSpace(request.RequesterName)
            ? "Demo User"
            : request.RequesterName.Trim(),
        RequesterImage = RandomUserAvatarGenerator.Generate(faker),
        CreatedAt = now,
        LastMessageAt = now,
        ResponseDueAt = now.AddHours(24),
        Priority = priority!,
        Status = "Open",
        IsFavorite = false,
        AssignedTechnicianId = defaultTechnician.Id,
        AssignedTechnician = defaultTechnician,
        TeamId = assignedTeam.Id,
        Team = assignedTeam
    };

    dbContext.Tickets.Add(ticket);
    await dbContext.SaveChangesAsync();

    return Results.Created(
        $"/api/tickets/{ticket.Id}",
        ToTicketResponse(ticket)
    );
}

static async Task<IResult> UpdateTicketAsync(
    int id,
    UpdateTicketRequest request,
    TicketDbContext dbContext
)
{
    // Ticket assignment is valid only when the chosen technician belongs to the chosen team.
    var ticket = await dbContext.Tickets
        .FirstOrDefaultAsync(currentTicket => currentTicket.Id == id);

    if (ticket is null)
    {
        return Results.NotFound();
    }

    var errors = new Dictionary<string, string[]>();
    var title = request.Title?.Trim() ?? string.Empty;
    var description = request.Description?.Trim() ?? string.Empty;
    var priorities = new[] { "Low", "Medium", "High", "Urgent" };
    var statuses = new[] { "Open", "In Progress", "Resolved" };
    var priority = priorities.FirstOrDefault(
        option => string.Equals(
            option,
            request.Priority?.Trim(),
            StringComparison.OrdinalIgnoreCase
        )
    );
    var status = statuses.FirstOrDefault(
        option => string.Equals(
            option,
            request.Status?.Trim(),
            StringComparison.OrdinalIgnoreCase
        )
    );

    if (title.Length == 0)
    {
        errors[nameof(request.Title)] = ["Title is required."];
    }

    if (description.Length == 0)
    {
        errors[nameof(request.Description)] = ["Description is required."];
    }

    if (priority is null)
    {
        errors[nameof(request.Priority)] =
            ["Priority must be Low, Medium, High, or Urgent."];
    }

    if (status is null)
    {
        errors[nameof(request.Status)] =
            ["Status must be Open, In Progress, or Resolved."];
    }

    var assignedTechnician = request.AssignedTechnicianId.HasValue
        ? await dbContext.Technicians
            .Include(technician => technician.TeamMemberships)
            .ThenInclude(membership => membership.Team)
            .FirstOrDefaultAsync(technician =>
                technician.Id == request.AssignedTechnicianId.Value &&
                technician.Role == "IT Support Technician")
        : null;

    if (assignedTechnician is null)
    {
        errors[nameof(request.AssignedTechnicianId)] =
            ["Choose an existing technician to assign this ticket to."];
    }
    else if (!request.TeamId.HasValue)
    {
        errors[nameof(request.TeamId)] = ["Choose a team for this ticket."];
    }
    else if (!assignedTechnician.TeamMemberships.Any(
        membership => membership.TeamId == request.TeamId.Value
    ))
    {
        errors[nameof(request.TeamId)] =
            ["Choose a team that the assigned technician belongs to."];
    }

    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var technicianToAssign = assignedTechnician!;
    var teamToAssign = technicianToAssign.TeamMemberships
        .First(membership => membership.TeamId == request.TeamId!.Value)
        .Team;

    ticket.Title = title;
    ticket.Description = description;
    ticket.Priority = priority!;
    ticket.Status = status!;
    ticket.AssignedTechnicianId = technicianToAssign.Id;
    ticket.AssignedTechnician = technicianToAssign;
    ticket.TeamId = teamToAssign.Id;
    ticket.Team = teamToAssign;

    await dbContext.SaveChangesAsync();

    return Results.Ok(ToTicketResponse(ticket));
}

static async Task<IResult> UpdateTechnicianAsync(
    int id,
    UpdateTechnicianRequest request,
    TicketDbContext dbContext
)
{
    var technician = await dbContext.Technicians
        .FirstOrDefaultAsync(current => current.Id == id);

    if (technician is null)
    {
        return Results.NotFound();
    }

    var errors = new Dictionary<string, string[]>();
    var name = request.Name?.Trim() ?? string.Empty;
    var email = request.Email?.Trim() ?? string.Empty;
    var role = request.Role?.Trim() ?? string.Empty;
    var validRoles = new[] { "IT Support Technician", "Administrator" };

    if (name.Length == 0 || name.Length > 120)
    {
        errors[nameof(request.Name)] = ["Name is required and must be 120 characters or fewer."];
    }

    if (
        email.Length == 0 ||
        email.Length > 254 ||
        !MailAddress.TryCreate(email, out var parsedEmail) ||
        !string.Equals(parsedEmail.Address, email, StringComparison.OrdinalIgnoreCase)
    )
    {
        errors[nameof(request.Email)] = ["Enter a valid email address (254 characters or fewer)."];
    }

    if (!validRoles.Contains(role, StringComparer.Ordinal))
    {
        errors[nameof(request.Role)] = ["Role must be IT Support Technician or Administrator."];
    }

    if (request.IsAvailable is null)
    {
        errors[nameof(request.IsAvailable)] = ["Availability is required."];
    }

    var requestedTeamIds = request.TeamIds?.Distinct().ToList() ?? [];
    if (request.TeamIds is null)
    {
        errors[nameof(request.TeamIds)] = ["Specify the technician's team memberships."];
    }
    else if (requestedTeamIds.Count != request.TeamIds.Count)
    {
        errors[nameof(request.TeamIds)] = ["A team may only be selected once."];
    }

    if (
        request.TeamIds is not null &&
        await dbContext.Teams.CountAsync(team => requestedTeamIds.Contains(team.Id)) !=
            requestedTeamIds.Count
    )
    {
        errors[nameof(request.TeamIds)] = ["Select only existing teams."];
    }

    if (request.TeamIds is not null)
    {
        // Existing tickets keep their team, so block removing a membership they depend on.
        var assignedTicketTeamIds = await dbContext.Tickets
            .Where(ticket => ticket.AssignedTechnicianId == id)
            .Select(ticket => ticket.TeamId)
            .Distinct()
            .ToListAsync();

        if (assignedTicketTeamIds.Any(teamId => !requestedTeamIds.Contains(teamId)))
        {
            errors[nameof(request.TeamIds)] =
                ["Reassign tickets before removing a team used by this technician's tickets."];
        }
    }

    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    technician.Name = name;
    technician.Email = email;
    technician.Role = role;
    technician.IsAvailable = request.IsAvailable!.Value;

    var existingMemberships = await dbContext.TechnicianTeams
        .Where(membership => membership.TechnicianId == id)
        .ToListAsync();
    var membershipsToRemove = existingMemberships
        .Where(membership => !requestedTeamIds.Contains(membership.TeamId))
        .ToList();
    var existingTeamIds = existingMemberships
        .Select(membership => membership.TeamId)
        .ToHashSet();

    dbContext.TechnicianTeams.RemoveRange(membershipsToRemove);
    dbContext.TechnicianTeams.AddRange(
        requestedTeamIds
            .Where(teamId => !existingTeamIds.Contains(teamId))
            .Select(teamId => new TechnicianTeam
            {
                TechnicianId = id,
                TeamId = teamId
            })
    );

    await dbContext.SaveChangesAsync();

    var teams = await dbContext.Teams
        .AsNoTracking()
        .Where(team => requestedTeamIds.Contains(team.Id))
        .OrderBy(team => team.Name)
        .ToListAsync();

    return Results.Ok(new
    {
        technician.Id,
        technician.Name,
        technician.Email,
        technician.Role,
        technician.IsAvailable,
        technician.IsDefault,
        TeamIds = teams.Select(team => team.Id).ToList(),
        TeamNames = teams.Select(team => team.Name).ToList(),
        TeamName = string.Join(", ", teams.Select(team => team.Name))
    });
}

static TicketResponse ToTicketResponse(Ticket ticket)
{
    // Flatten related names into the response so clients need no EF navigation graph.
    return new TicketResponse(
        ticket.Id,
        ticket.Title,
        ticket.Description,
        ticket.RequesterName,
        ticket.RequesterImage,
        ticket.CreatedAt,
        ticket.LastMessageAt,
        ticket.ResponseDueAt,
        ticket.Priority,
        ticket.Status,
        ticket.IsFavorite,
        ticket.AssignedTechnicianId,
        ticket.AssignedTechnician.Name,
        ticket.TeamId,
        ticket.Team.Name
    );
}

static TicketNoteResponse ToTicketNoteResponse(TicketNote note)
{
    // Include the author's display name while keeping the note response independent of EF.
    return new TicketNoteResponse(
        note.Id,
        note.TicketId,
        note.Content,
        note.CreatedAt,
        note.TechnicianId,
        note.Technician.Name
    );
}

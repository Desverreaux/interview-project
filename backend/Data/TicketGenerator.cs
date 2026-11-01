using Backend.Models;
using Bogus;
using Bogus.DataSets;

namespace Backend.Data;

public static class TicketGenerator
{
    private static readonly (string Title, string Description)[] TicketTemplates =
    [
        ("Unable to connect to Wi-Fi", "My laptop keeps disconnecting from the office network."),
        ("Applying for a refund", "I need help with the refund process for a recent purchase."),
        ("Design files update", "Please update the shared design files with the latest revisions."),
        ("Unable to sign in", "I receive an error after entering my account password."),
        ("New monitor setup", "My workstation is not detecting the external monitor."),
        ("Email is not syncing", "New messages are not appearing in my email inbox."),
        ("Request access to shared drive", "I need access to the project folder on the shared drive."),
        ("Printer is not responding", "The office printer is not responding to print requests.")
    ];

    private static readonly string[] Priorities = ["Low", "Medium", "High", "Urgent"];
    private static readonly string[] Statuses = ["Open", "In Progress", "Resolved"];
    private static readonly Name.Gender[] RequesterGenders =
    [
        Name.Gender.Male,
        Name.Gender.Female
    ];

    public static List<Ticket> GenerateTickets(int count = 8)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(count);

        var faker = new Faker();
        var randomizedTemplates = faker.Random.Shuffle(TicketTemplates).ToArray();
        var now = DateTime.UtcNow;
        var firstTicketId = faker.Random.Int(4000, 9000);
        var generatedTickets = new List<Ticket>(count);

        for (var index = 0; index < count; index++)
        {
            var template = randomizedTemplates[index % randomizedTemplates.Length];
            var createdAt = AsUtc(faker.Date.Recent(14, now));
            var lastMessageAt = AsUtc(
                faker.Date.Between(createdAt.UtcDateTime, now)
            );
            var requesterGender = faker.Random.ArrayElement(RequesterGenders);
            // Distribute demo tickets evenly across the four seeded technicians.
            var assignedTechnicianId = index % 4 + 1;

            generatedTickets.Add(new Ticket
            {
                Id = firstTicketId + index,
                Title = template.Title,
                Description = template.Description,
                RequesterName = faker.Name.FullName(requesterGender),
                RequesterImage = RandomUserAvatarGenerator.Generate(
                    faker,
                    requesterGender
                ),
                CreatedAt = createdAt,
                LastMessageAt = lastMessageAt,
                ResponseDueAt = AsUtc(faker.Date.Soon(2, now)),
                Priority = faker.Random.ArrayElement(Priorities),
                Status = faker.Random.ArrayElement(Statuses),
                IsFavorite = false,
                AssignedTechnicianId = assignedTechnicianId,
                TeamId = assignedTechnicianId <= 2 ? 1 : 2
            });
        }

        return generatedTickets;
    }

    private static DateTimeOffset AsUtc(DateTime value)
    {
        var utcValue = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        return new DateTimeOffset(utcValue);
    }
}

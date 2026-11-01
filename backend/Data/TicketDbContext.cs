using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class TicketDbContext : DbContext
{
    public TicketDbContext(DbContextOptions<TicketDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Technician> Technicians => Set<Technician>();
    public DbSet<TechnicianTeam> TechnicianTeams => Set<TechnicianTeam>();
    public DbSet<TicketNote> TicketNotes => Set<TicketNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Team>(entity =>
        {
            entity.Property(team => team.Name)
                .HasMaxLength(100)
                .IsRequired();
            entity.HasIndex(team => team.Name).IsUnique();
            entity.HasData(
                new Team { Id = 1, Name = "Desktop Support" },
                new Team { Id = 2, Name = "Application Support" }
            );
        });

        modelBuilder.Entity<Technician>(entity =>
        {
            entity.Property(technician => technician.Name)
                .HasMaxLength(120)
                .IsRequired();
            entity.Property(technician => technician.Email)
                .HasMaxLength(254)
                .IsRequired();
            entity.Property(technician => technician.Role)
                .HasMaxLength(50)
                .IsRequired();
            entity.HasIndex(technician => technician.Email).IsUnique();
            entity.HasData(
                new Technician
                {
                    Id = 1,
                    Name = "Casey Morgan",
                    Email = "casey.morgan@example.com",
                    Role = "IT Support Technician",
                    IsAvailable = true,
                    IsDefault = true
                },
                new Technician
                {
                    Id = 2,
                    Name = "Jordan Lee",
                    Email = "jordan.lee@example.com",
                    Role = "IT Support Technician",
                    IsAvailable = true,
                    IsDefault = false
                },
                new Technician
                {
                    Id = 3,
                    Name = "Sam Rivera",
                    Email = "sam.rivera@example.com",
                    Role = "IT Support Technician",
                    IsAvailable = true,
                    IsDefault = false
                },
                new Technician
                {
                    Id = 4,
                    Name = "Avery Brooks",
                    Email = "avery.brooks@example.com",
                    Role = "IT Support Technician",
                    IsAvailable = true,
                    IsDefault = false
                },
                new Technician
                {
                    Id = 5,
                    Name = "Riley Chen",
                    Email = "riley.chen@example.com",
                    Role = "Administrator",
                    IsAvailable = true,
                    IsDefault = false
                }
            );
        });

        modelBuilder.Entity<TechnicianTeam>(entity =>
        {
            // The composite key prevents duplicate memberships; deleting a parent removes only its links.
            entity.HasKey(membership => new
            {
                membership.TechnicianId,
                membership.TeamId
            });
            entity.HasOne(membership => membership.Technician)
                .WithMany(technician => technician.TeamMemberships)
                .HasForeignKey(membership => membership.TechnicianId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(membership => membership.Team)
                .WithMany(team => team.TechnicianMemberships)
                .HasForeignKey(membership => membership.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(membership => membership.TeamId);
            entity.ToTable("TechnicianTeams");
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            // Restrict deletes so a technician or team cannot be removed while tickets reference it.
            entity.HasOne(ticket => ticket.AssignedTechnician)
                .WithMany(technician => technician.AssignedTickets)
                .HasForeignKey(ticket => ticket.AssignedTechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(ticket => ticket.Team)
                .WithMany(team => team.Tickets)
                .HasForeignKey(ticket => ticket.TeamId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(ticket => ticket.Notes)
                .WithOne(note => note.Ticket)
                .HasForeignKey(note => note.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TicketNote>(entity =>
        {
            entity.Property(note => note.Content)
                .HasMaxLength(2000)
                .IsRequired();
            entity.HasOne(note => note.Technician)
                .WithMany()
                .HasForeignKey(note => note.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
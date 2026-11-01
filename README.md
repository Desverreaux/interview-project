# IT Help Desk

A mobile-first IT help desk application built as a full-stack interview portfolio project. It demonstrates a practical support workflow with a React frontend, an ASP.NET Core API, and SQLite persistence.

**Live demo:** [interview.desverreaux.com](https://interview.desverreaux.com/)

## Features

- Browse, create, and update support tickets.
- Set ticket priority and status, and assign tickets to technicians and teams.
- View all tickets, personal assignments, team queues, and completed work.
- Add persistent notes to tickets with technician attribution and timestamps.
- View and edit technician profiles, availability, and team memberships.
- Use a responsive interface designed for mobile screens as well as desktop.

## Technology

- **Frontend:** React, Vite, Bootstrap, and React-Bootstrap.
- **Backend:** ASP.NET Core Minimal APIs on .NET 10.
- **Persistence:** Entity Framework Core with SQLite.
- **Hosting:** Ubuntu on AWS EC2, Nginx, and HTTPS.

## Run locally

### Requirements

- .NET 10 SDK
- Node.js and npm versions supported by the installed Vite release

### Start the API

In a terminal from the repository root:

```bash
cd backend
dotnet tool restore
dotnet ef database update
dotnet run --launch-profile http
```

The API listens at `http://localhost:5000`. The migration command creates or updates the local SQLite schema. On first startup, the API seeds example tickets if the database has none.

### Start the frontend

In a second terminal from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Vite forwards `/api` requests to the API at `http://127.0.0.1:5000`.

The local database is stored at `backend/App_Data/tickets.db`. It is intentionally excluded from Git; local ticket changes persist across API restarts.

## API overview

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/tickets` | List tickets |
| `GET` | `/api/tickets/{id}` | Get a ticket |
| `POST` | `/api/tickets` | Create a ticket |
| `PUT` | `/api/tickets/{id}` | Update ticket details and assignment |
| `GET` | `/api/tickets/{id}/notes` | List a ticket's notes |
| `POST` | `/api/tickets/{id}/notes` | Add a note |
| `GET` | `/api/technicians` | List technician profiles and team memberships |
| `PUT` | `/api/technicians/{id}` | Update a technician profile |
| `GET` | `/api/teams` | List teams |

Tickets belong to one team and are assigned to one technician. The API validates that the technician is a member of the ticket's team. Technician-to-team memberships are many-to-many.

## Useful checks

Run these commands from the corresponding directory:

```bash
# frontend/
npm run lint
npm run build

# backend/
dotnet build
```

## Deployment

The production frontend is served by Nginx, while the API runs as the `interview-app` systemd service. To redeploy only the frontend on the EC2 server:

```bash
cd /home/ubuntu/interview-project/frontend
npm run build
sudo rsync -a --delete dist/ /var/www/interview-app/
```

This updates the static frontend only; it does not deploy backend changes or restart the API.

## Demo limitations

This is a public portfolio demo, not a production help desk. It does not authenticate or authorize users, and changes affect shared demo data. Use only sample data; do not enter real names, credentials, or sensitive ticket information.
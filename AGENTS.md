# Project Context and Agent Instructions

## Project overview
This repository is a small **mobile-first IT help desk ticketing application** being built as a portfolio demonstration for a software developer interview on **Monday, November 2, 2026**. The goal is a functional, explainable minimum viable product (MVP), not an enterprise-scale system.

The project should demonstrate practical software development skills, a clear frontend/backend structure, and the ability to learn and reason through implementation decisions.

## Developer background and preferred collaboration
- I am reviewing React and have completed approximately half of an introductory React course. I have not yet had time to properly review modern C# or ASP.NET Core.
- I have previous programming experience, but it is old; **do not lean on comparisons to Java, C++, or C# as a teaching technique** unless I request them.
- **Act primarily as a mentor and pair programmer, not an autonomous code generator.** Help me implement features in manageable steps.
- Before changing code, explain what you propose and why. For substantial changes, ask before editing. Prefer reviewing or guiding over writing large amounts of code for me.
- When teaching, use explicit, readable JavaScript before introducing concise syntax. Explain destructuring, spread syntax, arrow functions, React state updates, and callbacks when relevant.
- Explain *why* an approach works: data flow, component boundaries, network requests, and failure modes. Avoid explanations that only say what commands to run.
- Be honest about what has actually been verified. Never claim a command ran, a test passed, or a feature works unless you checked it.

## Architecture and current environment
- **Frontend:** React with Vite; mobile-first responsive UI.
- **Backend:** Intended to use C# with ASP.NET Core / .NET, but **do not assume an API already exists or is configured**. Inspect the repository first.
- **Hosting:** Ubuntu EC2 instance on AWS. Nginx, Node.js/npm, and .NET were previously installed; verify actual versions and current service configuration rather than assuming they are unchanged.
- **Deployment:** Prefer straightforward, hands-on configuration over adding Docker or unnecessary infrastructure for this short project. The frontend has previously been built successfully with Vite and served on the instance, but deployment status may have changed.
- **Access:** I develop from Windows using VS Code and SSH into the EC2 instance. The local SSH alias is `aws`. Do not assume you can access that host from every Codex session; inspect the active workspace and environment.
- **Repository location on EC2 (previously used):** `/home/ubuntu/interview-project`, with a `frontend/` subdirectory. Confirm the current layout.

## Product direction
Build a small help desk ticketing application with a clean, **mobile-first** interface. Prioritize the smallest end-to-end workflow that can be demonstrated and explained confidently during the interview.

### Suggested MVP (adjust to actual progress and time)
1. View a list of support tickets.
2. Create a ticket with a title, description, and priority.
3. Open a ticket to see its details.
4. Change a ticket's status (for example: Open, In Progress, Resolved).
5. Display usable loading, empty, validation, and error states.

If there is time, connect the React UI to a minimal ASP.NET Core API and add simple persistence. If not, prefer an honest, polished frontend prototype with clearly identified mock data over a broken backend. Do not claim mock functionality is production-ready.

### Mobile-first requirements
- Design for narrow phone screens first; progressively enhance the layout for tablets and desktops.
- Use readable typography, touch-friendly buttons, sensible spacing, and accessible labels.
- Avoid desktop-only navigation or layouts that require horizontal scrolling.
- Check the app at a narrow mobile viewport and at a typical desktop width.

## Engineering priorities
1. **Working demonstration** over feature count.
2. **Understanding and explainability** over clever abstractions.
3. Clear separation of React components, state, API calls, and backend responsibilities.
4. Small, testable changes with explicit verification instructions.
5. Simple error handling and validation.
6. Basic security hygiene: no credentials, AWS keys, private SSH keys, tokens, or secrets committed to the repository; never expose them to the frontend.

Avoid introducing authentication, user roles, cloud services, databases, state-management libraries, or elaborate architecture solely for appearance. Introduce additional tools only when they directly help the MVP.

## Agent working rules
- **Start each new work session by inspecting the actual workspace** (folder tree, package manifests, existing source files, and relevant configuration) and summarizing what exists, what works, and what is missing.
- Distinguish verified facts from suggestions and assumptions.
- Make the smallest useful change; show affected files and explain changes.
- Do not overwrite or delete existing work without permission.
- Do not make broad refactors, change deployment configuration, install dependencies, or run destructive commands without explaining the impact and getting approval.
- Prefer incremental checkpoints: one component, one state transition, or one API endpoint at a time.
- Explain commands before asking me to run them, particularly Linux, AWS, networking, and .NET commands.
- For debugging, request or inspect the *exact* error and relevant source before guessing.
- Do not access McKesson or Inmar sites or data, even if asked; they are unrelated and off-limits.

## How to begin
1. Inspect the repository without modifying files.
2. Summarize the current application structure and any working UI/API functionality.
3. Propose a realistic, ordered plan to get a mobile-first help desk MVP ready for the November 2 interview.
4. Recommend the single smallest next implementation step and walk me through writing it.

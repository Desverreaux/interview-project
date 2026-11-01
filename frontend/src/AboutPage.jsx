// Keeps the portfolio overview separate from the API-backed ticket workflow.
function AboutPage() {
  return (
    <main className="ticket-page about-page">
      <h1>About This Project</h1>
      <p className="about-page__intro">
        A mobile-first IT help desk application built as an interview portfolio
        project. It demonstrates a complete support workflow, from a responsive
        interface to API-backed data. Its purpose was to demonstrate a understanding
        of full-stack development principles.

      </p>
      
      <p className="about-page__intro">
        A.I. has been used extensively to assist in code generation and database management. 
        While I typically write most of my own code, for this project I leveraged A.I. to speed
        up development such that the project could be completed in time for the interview.
      </p>
      
      <p className="about-page__intro">
        The code for this project can be found here: <a href="https://github.com/Desverreaux/interview-project" target="_blank" rel="noopener noreferrer">GitHub repository</a>.

      </p>

      <section className="about-page__section" aria-labelledby="about-workflow">
        <h2 id="about-workflow">What it does</h2>
        <ul>
          <li>Create and update support tickets, including priority and due dates.</li>
          <li>Assign work to technicians and teams, with personal and team queues.</li>
          <li>Add ticket notes, resolve work, and review completed tickets.</li>
        </ul>
      </section>

      <section className="about-page__section" aria-labelledby="about-technology">
        <h2 id="about-technology">Technical approach</h2>
        <ul>
          <li>
            <strong>Frontend:</strong> React and Vite, with reusable components
            and responsive, touch-friendly navigation.
          </li>
          <li>
            <strong>Backend:</strong> An ASP.NET Core API for ticket,
            technician, and team workflows.
          </li>
          <li>
            <strong>Persistence:</strong> Entity Framework Core with SQLite.
          </li>
          <li>
            <strong>Deployment:</strong> Linux EC2, Nginx, and HTTPS.
          </li>
        </ul>
      </section>

      <section className="about-page__section" aria-labelledby="about-purpose">
        <h2 id="about-purpose">Purpose and demo scope</h2>
        <p>
          The goal is to show practical engineering decisions across the
          frontend, API, and data layers, while keeping the application small
          enough to explain and demonstrate clearly.
        </p>
        <p>
          Sign-in is intentionally simulated for this demo: any non-empty
          password is accepted, and passwords are not sent to the API or stored.
          This is not production authentication.
        </p>
      </section>
    </main>
  )
}

export default AboutPage

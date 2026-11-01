import Card from 'react-bootstrap/Card'
import RequesterAvatar from './RequesterAvatar.jsx'

const priorityClassNames = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
  Urgent: 'priority-urgent',
}

function formatCreatedDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function getResponseDueLabel(value) {
  const dueTime = new Date(value).getTime()

  if (!Number.isFinite(dueTime)) {
    return 'Response time unavailable'
  }

  // Round up so a deadline less than an hour away still shows "1 hour".
  const hoursRemaining = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60))

  if (hoursRemaining <= 0) {
    return 'Response overdue'
  }

  const hourLabel = hoursRemaining === 1 ? 'hour' : 'hours'
  return `Response due in ${hoursRemaining} ${hourLabel}`
}

// Shows the key ticket summary; selection and list state remain owned by App.
function TicketCard(props) {
  const ticket = props.ticket
  const priorityClassName =
    priorityClassNames[ticket.priority] || 'priority-default'
  const animationDelay = Math.min(props.animationIndex ?? 0, 8) * 55

  return (
    <Card
      as="button"
      type="button"
      className={`ticket-card${
        ticket.status === 'Resolved' ? ' ticket-card--completed' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={props.onSelect}
    >
      <Card.Body>
        <div className="ticket-card__main">
          <RequesterAvatar
            className="ticket-card__avatar"
            imageUrl={ticket.requesterImage}
            name={ticket.requesterName}
          />

          <div className="ticket-card__content">
            <p className="ticket-card__requester">{ticket.requesterName}</p>
            <h2 className="ticket-card__title">
              {ticket.title} <span>#{ticket.id}</span>
            </h2>
            <p className="ticket-card__meta">
              {formatCreatedDate(ticket.createdAt)}
              <span aria-hidden="true">•</span>
              {getResponseDueLabel(ticket.responseDueAt)}
            </p>
          </div>
        </div>

        <div className="ticket-card__priority-row">
          <span className={`ticket-priority ${priorityClassName}`}>
            <span className="ticket-priority__dot" aria-hidden="true" />
            {ticket.priority}
          </span>
          <span className="ticket-card__assignee">
            Assigned to {ticket.assignedTechnicianName}
          </span>
        </div>
      </Card.Body>
    </Card>
  )
}

export default TicketCard

import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import RequesterAvatar from './RequesterAvatar.jsx'
import Form from 'react-bootstrap/Form'
import TicketNotes from './TicketNotes.jsx'
import { formatDateTime } from './formatDateTime.js'

const priorities = ['Low', 'Medium', 'High', 'Urgent']
const statuses = ['Open', 'In Progress', 'Resolved']

function getTechnicianTeamIds(technician) {
  // Support the current multi-team API and older single-team responses.
  if (Array.isArray(technician?.teamIds)) {
    return technician.teamIds
  }

  return technician?.teamId == null ? [] : [technician.teamId]
}

// Holds temporary edits; the parent callback performs the API save and state update.
function TicketEditForm(props) {
  const [title, setTitle] = useState(props.ticket.title)
  const [description, setDescription] = useState(props.ticket.description)
  const [priority, setPriority] = useState(props.ticket.priority)
  const [status, setStatus] = useState(props.ticket.status)
  const [assignedTechnicianId, setAssignedTechnicianId] = useState(
    String(props.ticket.assignedTechnicianId),
  )
  const [teamId, setTeamId] = useState(String(props.ticket.teamId))
  const selectedTechnician = props.technicians.find(
    (technician) => technician.id === Number(assignedTechnicianId),
  )
  const availableTeamIds = getTechnicianTeamIds(selectedTechnician)
  const availableTeams = props.teams.filter((team) =>
    availableTeamIds.includes(team.id),
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleAssignedTechnicianChange(event) {
    const nextTechnicianId = Number(event.target.value)
    const nextTechnician = props.technicians.find(
      (technician) => technician.id === nextTechnicianId,
    )
    const nextTeamIds = getTechnicianTeamIds(nextTechnician)

    setAssignedTechnicianId(event.target.value)
    // Keep the team valid; choose automatically only when the choice is unique.
    if (!nextTeamIds.includes(Number(teamId))) {
      setTeamId(nextTeamIds.length === 1 ? String(nextTeamIds[0]) : '')
    }
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const updatedTitle = title.trim()
    const updatedDescription = description.trim()

    if (updatedTitle.length === 0 || updatedDescription.length === 0) {
      setErrorMessage('Title and description are required.')
      return
    }

    if (!teamId || !availableTeamIds.includes(Number(teamId))) {
      setErrorMessage('Choose a team that the assigned technician belongs to.')
      return
    }

    setErrorMessage('')
    setIsSaving(true)

    try {
      await props.onSave({
        ...props.ticket,
        title: updatedTitle,
        description: updatedDescription,
        priority,
        status,
        assignedTechnicianId: Number(assignedTechnicianId),
        teamId: Number(teamId),
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not save this ticket.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form className="ticket-edit-form" onSubmit={handleSubmit}>
      <Card className="ticket-detail-card">
        <Card.Body>
          <h2 className="ticket-detail-heading">Edit Ticket</h2>
          <Form.Group className="mb-3" controlId="ticketTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              required
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setErrorMessage('')
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="ticketDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={4}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setErrorMessage('')
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="ticketPriority">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {priorities.map((currentPriority) => (
                <option key={currentPriority} value={currentPriority}>
                  {currentPriority}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="ticketStatus">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statuses.map((currentStatus) => (
                <option key={currentStatus} value={currentStatus}>
                  {currentStatus}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {errorMessage && (
            <p className="ticket-edit-error" role="alert">
              {errorMessage}
            </p>
          )}
        </Card.Body>
      </Card>

      <Card className="ticket-detail-card">
        <Card.Body>
          <h2 className="ticket-detail-heading">Responsibility</h2>
          <Form.Group className="mb-3" controlId="ticketAssignedTechnician">
            <Form.Label>Assigned technician</Form.Label>
            <Form.Select
              required
              value={assignedTechnicianId}
              disabled={
                props.isTechniciansLoading || props.technicians.length === 0
              }
              onChange={handleAssignedTechnicianChange}
            >
              {props.technicians.length === 0 && (
                <option value={props.ticket.assignedTechnicianId}>
                  {props.ticket.assignedTechnicianName}
                </option>
              )}
              {props.technicians
                .filter(
                  (technician) =>
                    technician.role === 'IT Support Technician',
                )
                .map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="ticketAssignedTeam">
            <Form.Label>Assigned team</Form.Label>
            <Form.Select
              required
              value={teamId}
              disabled={
                props.isTechniciansLoading || availableTeams.length === 0
              }
              onChange={(event) => {
                setTeamId(event.target.value)
                setErrorMessage('')
              }}
            >
              <option value="" disabled>
                Select a team
              </option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      <div className="ticket-edit-actions">
        <Button
          type="button"
          variant="outline-secondary"
          onClick={props.onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </Form>
  )
}

// Combines the selected ticket, its editable fields, and its note history.
function TicketDetails(props) {
  const ticket = props.ticket
  const [isEditing, setIsEditing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionError, setCompletionError] = useState('')

  async function handleSave(updatedTicket) {
    await props.onSave(updatedTicket)
    setIsEditing(false)
  }

  async function handleComplete() {
    setIsCompleting(true)
    setCompletionError('')

    try {
      await props.onComplete({ ...ticket, status: 'Resolved' })
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : 'Could not complete this ticket.',
      )
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <main className="ticket-page ticket-details-page">
      <header className="ticket-details-header">
        <button
          className="ticket-details-back"
          type="button"
          onClick={props.onBack}
          aria-label={props.backLabel}
        >
          <span aria-hidden="true">←</span>
        </button>
        <h1>{isEditing ? 'Edit Ticket' : 'Ticket Details'}</h1>
        {isEditing ? (
          <span className="ticket-details-header__spacer" aria-hidden="true" />
        ) : (
          <div className="ticket-details-actions">
            <button
              className={`ticket-action-button${props.isFavorite ? ' is-favorite' : ''}`}
              type="button"
              onClick={props.onToggleFavorite}
              aria-label={
                props.isFavorite
                  ? 'Remove ticket from favorites'
                  : 'Add ticket to favorites'
              }
              aria-pressed={props.isFavorite}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill={props.isFavorite ? 'currentColor' : 'none'}
              >
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
              </svg>
            </button>
            <button
              className="ticket-action-button"
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={
                props.isTechniciansLoading || props.technicians.length === 0
              }
              aria-label="Edit ticket"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path d="m14 5 5 5M4 20l4.3-.9L19 8.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {isEditing ? (
        <TicketEditForm
          ticket={ticket}
          technicians={props.technicians}
          teams={props.teams}
          isTechniciansLoading={props.isTechniciansLoading}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="ticket-details-content">
          <Card className="ticket-detail-card">
            <Card.Body>
              <h2 className="ticket-detail-heading">Ticket Info</h2>
              <h3 className="ticket-detail-title">{ticket.title}</h3>
              <dl className="ticket-info-list">
                <div>
                  <dt>Ticket ID</dt>
                  <dd>#{ticket.id}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last message</dt>
                  <dd>{formatDateTime(ticket.lastMessageAt)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{ticket.status}</dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>{ticket.priority}</dd>
                </div>
              </dl>
            </Card.Body>
          </Card>

          <Card className="ticket-detail-card">
            <Card.Body>
              <h2 className="ticket-detail-heading">Responsibility</h2>
              <dl className="ticket-info-list">
                <div>
                  <dt>Assigned technician</dt>
                  <dd>{ticket.assignedTechnicianName}</dd>
                </div>
                <div>
                  <dt>Assigned team</dt>
                  <dd>{ticket.teamName || 'Team not available'}</dd>
                </div>
              </dl>
            </Card.Body>
          </Card>

          <Card className="ticket-detail-card">
            <Card.Body>
              <h2 className="ticket-detail-heading">Description</h2>
              <p className="ticket-detail-description">{ticket.description}</p>
            </Card.Body>
          </Card>

          <Card className="ticket-detail-card">
            <Card.Body>
              <h2 className="ticket-detail-heading">Requester</h2>
              <div className="ticket-requester">
                <RequesterAvatar
                  className="ticket-details-avatar"
                  imageUrl={ticket.requesterImage}
                  name={ticket.requesterName}
                />
                <span>{ticket.requesterName}</span>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
      <TicketNotes
        key={ticket.id}
        ticketId={ticket.id}
        technicianId={props.technicianId}
      />
      {!isEditing && ticket.status !== 'Resolved' && (
        <div className="ticket-completion-action">
          {completionError && (
            <p className="ticket-completion-action__error" role="alert">
              {completionError}
            </p>
          )}
          <Button
            className="ticket-completion-action__button"
            type="button"
            variant="success"
            disabled={isCompleting}
            onClick={handleComplete}
          >
            {isCompleting ? 'Completing...' : 'Mark as complete'}
          </Button>
        </div>
      )}
      {!isEditing && ticket.status === 'Resolved' && (
        <p className="ticket-archived-notice" role="status">
          This ticket is complete and appears at the bottom of Tickets.
        </p>
      )}
    </main>
  )
}

export default TicketDetails

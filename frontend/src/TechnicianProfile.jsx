import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

// Keeps profile edits local until the parent validates and saves the complete profile.
function TechnicianEditForm(props) {
  const technician = props.technician
  const [name, setName] = useState(technician.name)
  const [email, setEmail] = useState(technician.email)
  const [role, setRole] = useState(technician.role)
  const [teamIds, setTeamIds] = useState(
    Array.isArray(technician.teamIds)
      ? technician.teamIds
      : technician.teamId == null
        ? []
        : [technician.teamId],
  )
  const [isAvailable, setIsAvailable] = useState(technician.isAvailable)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    const updatedName = name.trim()
    const updatedEmail = email.trim()

    if (updatedName.length === 0 || updatedEmail.length === 0) {
      setErrorMessage('Name and email are required.')
      return
    }

    setErrorMessage('')
    setIsSaving(true)

    try {
      await props.onSave({
        ...technician,
        name: updatedName,
        email: updatedEmail,
        role,
        teamIds,
        isAvailable,
      })
      props.onCancel()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not save this profile.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="technician-info-card" aria-labelledby="edit-profile">
      <h2 id="edit-profile" className="technician-info-heading">
        Edit profile
      </h2>
      <Form className="technician-edit-form" onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="technicianName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="technicianEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="technicianRole">
          <Form.Label>Role</Form.Label>
          <Form.Select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="IT Support Technician">IT Support Technician</option>
            <option value="Administrator">Administrator</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as="fieldset" className="mb-3">
          <Form.Label as="legend">Teams</Form.Label>
          {props.teams.map((team) => (
            <Form.Check
              key={team.id}
              id={`technician-${technician.id}-team-${team.id}`}
              type="checkbox"
              label={team.name}
              checked={teamIds.includes(team.id)}
              onChange={(event) => {
                // Submit the complete membership list; the API replaces it as a set.
                setTeamIds((currentTeamIds) =>
                  event.target.checked
                    ? [...currentTeamIds, team.id]
                    : currentTeamIds.filter(
                        (currentTeamId) => currentTeamId !== team.id,
                      ),
                )
              }}
            />
          ))}
          {props.teams.length === 0 && (
            <p className="ticket-state">No teams are available.</p>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="technicianAvailability">
          <Form.Label>Availability</Form.Label>
          <Form.Select
            value={isAvailable ? 'available' : 'unavailable'}
            onChange={(event) =>
              setIsAvailable(event.target.value === 'available')
            }
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Form.Select>
        </Form.Group>

        {errorMessage && (
          <p className="ticket-edit-error" role="alert">
            {errorMessage}
          </p>
        )}

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
    </section>
  )
}

// Switches between the technician summary and its edit form.
function TechnicianProfile(props) {
  const technician = props.technician
  const [isEditing, setIsEditing] = useState(false)

  return (
    <main className="ticket-page technician-profile-page">
      <header className="technician-profile-header">
        <h1>{isEditing ? 'Edit Technician' : 'Technician Profile'}</h1>
        {!isEditing && (
          <div className="technician-profile-actions">
            <Dropdown align="end">
              <Dropdown.Toggle
                id="technician-profile-menu"
                variant="primary"
                className="technician-profile-menu-toggle app-primary-button"
                aria-label="Profile actions"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  as="button"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Dropdown.Item>
                <Dropdown.Item
                  as="button"
                  type="button"
                  onClick={props.onSignOut}
                >
                  Sign out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )}
      </header>

      {props.accountError && (
        <p className="ticket-state ticket-state--error" role="alert">
          {props.accountError}
        </p>
      )}

      <section
        className="technician-profile-card"
        aria-labelledby="technician-name"
      >
        <div className="technician-profile-avatar" aria-hidden="true">
          {getInitials(technician.name)}
        </div>
        <div>
          <p className="technician-profile-label">
            {technician.isDefault ? 'Default technician' : technician.role}
          </p>
          <h2 id="technician-name" className="technician-profile-name">
            {technician.name}
          </h2>
          <p className="technician-profile-role">{technician.role}</p>
        </div>
      </section>

      {isEditing ? (
        <TechnicianEditForm
          technician={technician}
          teams={props.teams}
          onSave={props.onSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <section className="technician-info-card" aria-labelledby="work-info">
          <h2 id="work-info" className="technician-info-heading">
            Work information
          </h2>
          <dl className="technician-info-list">
            <div>
              <dt>Teams</dt>
              <dd>{technician.teamName || 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{technician.email}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span
                  className={`technician-status${
                    technician.isAvailable ? '' : ' is-unavailable'
                  }`}
                >
                  {technician.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </dd>
            </div>
          </dl>
        </section>
      )}

      <p className="technician-profile-note">
        Demo account selection does not verify identity; staff profile edits
        are unauthenticated.
      </p>
    </main>
  )
}

export default TechnicianProfile

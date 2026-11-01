import { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { addTicketNote, getTicketNotes } from './api/tickets.js'
import { formatDateTime } from './formatDateTime.js'

// Loads note history for the selected ticket and persists new notes through the API.
function TicketNotes(props) {
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadNotes() {
      setIsLoading(true)
      setLoadError('')

      try {
        const ticketNotes = await getTicketNotes(
          props.ticketId,
          controller.signal,
        )
        setNotes(ticketNotes)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : 'Could not load notes.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadNotes()

    return () => controller.abort()
  }, [props.ticketId, retryCount])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaveError('')

    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      setSaveError('Write a note before adding it.')
      return
    }

    setIsSaving(true)

    try {
      const savedNote = await addTicketNote(
        props.ticketId,
        trimmedContent,
        props.technicianId,
      )
      // Use the server response so the new entry has its persisted ID and timestamp.
      setNotes((currentNotes) => [savedNote, ...currentNotes])
      setContent('')
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Could not save this note.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const latestNote = notes[0]

  return (
    <Card className="ticket-detail-card ticket-notes">
      <Card.Body>
        <h2 className="ticket-detail-heading">Notes</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId={`ticketNote-${props.ticketId}`}>
            <Form.Label>Add a note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={content}
              onChange={(event) => {
                setContent(event.target.value)
                setSaveError('')
              }}
              disabled={isLoading || Boolean(loadError) || isSaving}
            />
          </Form.Group>
          {saveError && (
            <p className="ticket-edit-error" role="alert">
              {saveError}
            </p>
          )}
          <div className="ticket-notes__form-actions">
            <Button
              className="app-primary-button"
              type="submit"
              variant="primary"
              disabled={
                isLoading || Boolean(loadError) || isSaving || !content.trim()
              }
            >
              {isSaving ? 'Adding note...' : 'Add note'}
            </Button>
          </div>
        </Form>

        {isLoading ? (
          <p className="ticket-state" role="status">
            Loading notes...
          </p>
        ) : loadError ? (
          <div className="ticket-state ticket-state--error" role="alert">
            <p>{loadError}</p>
            <button
              className="ticket-state__retry"
              type="button"
              onClick={() => setRetryCount((currentCount) => currentCount + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {latestNote && (
              <p className="ticket-notes__last-edited">
                Last edited by <strong>{latestNote.technicianName}</strong>
                {' · '}
                <time dateTime={latestNote.createdAt}>
                  {formatDateTime(latestNote.createdAt)}
                </time>
              </p>
            )}
            <div className="ticket-notes__history" aria-live="polite">
              {notes.length === 0 ? (
                <p className="ticket-state" role="status">
                  No notes yet.
                </p>
              ) : (
                notes.map((note) => (
                  <article className="ticket-note" key={note.id}>
                    <p className="ticket-note__content">{note.content}</p>
                    <p className="ticket-note__meta">
                      <strong>{note.technicianName}</strong>
                      <time dateTime={note.createdAt}>
                        {formatDateTime(note.createdAt)}
                      </time>
                    </p>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  )
}

export default TicketNotes

import { getApiErrorMessage } from './errors.js'

const ticketsEndpoint = '/api/tickets'

export async function getTickets(signal) {
  const response = await fetch(ticketsEndpoint, { signal })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const tickets = await response.json()

  if (!Array.isArray(tickets)) {
    throw new Error('The ticket API returned an invalid response.')
  }

  return tickets
}

export async function getTicketNotes(ticketId, signal) {
  const response = await fetch(`${ticketsEndpoint}/${ticketId}/notes`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const notes = await response.json()

  if (!Array.isArray(notes)) {
    throw new Error('The ticket notes API returned an invalid response.')
  }

  return notes
}

export async function addTicketNote(ticketId, content, technicianId, signal) {
  const response = await fetch(`${ticketsEndpoint}/${ticketId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, technicianId }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return response.json()
}

export async function updateTicket(ticket, signal) {
  const response = await fetch(`${ticketsEndpoint}/${ticket.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignedTechnicianId: ticket.assignedTechnicianId,
      teamId: ticket.teamId,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return response.json()
}

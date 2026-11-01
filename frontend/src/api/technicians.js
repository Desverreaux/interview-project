import { getApiErrorMessage } from './errors.js'

const techniciansEndpoint = '/api/technicians'
const teamsEndpoint = '/api/teams'

export async function getTechnicians(signal) {
  const response = await fetch(techniciansEndpoint, { signal })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const technicians = await response.json()

  if (!Array.isArray(technicians)) {
    throw new Error('The technician API returned an invalid response.')
  }

  return technicians
}

export async function getTeams(signal) {
  const response = await fetch(teamsEndpoint, { signal })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const teams = await response.json()

  if (!Array.isArray(teams)) {
    throw new Error('The teams API returned an invalid response.')
  }

  return teams
}

export async function updateTechnician(technician, signal) {
  const response = await fetch(`${techniciansEndpoint}/${technician.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: technician.name,
      email: technician.email,
      role: technician.role,
      teamIds: technician.teamIds,
      isAvailable: technician.isAvailable,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return response.json()
}

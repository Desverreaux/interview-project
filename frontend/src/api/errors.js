export async function getApiErrorMessage(response) {
  const responseText = await response.text()

  if (responseText.length === 0) {
    return `Request failed (${response.status} ${response.statusText}).`
  }

  try {
    const body = JSON.parse(responseText)
    const validationMessages = Object.values(body.errors || {}).flat()

    if (validationMessages.length > 0) {
      return validationMessages.join(' ')
    }

    return body.title || `Request failed (${response.status} ${response.statusText}).`
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `Request failed (${response.status} ${response.statusText}).`
    }

    throw error
  }
}

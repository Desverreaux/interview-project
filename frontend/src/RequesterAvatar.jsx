import { useState } from 'react'

function getInitials(name) {
  const nameParts =
    typeof name === 'string' ? name.trim().split(/\s+/).filter(Boolean) : []

  if (nameParts.length === 0) {
    return '?'
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase()
  }

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
}

// Requester photos are decorative; show initials if the URL is missing or fails.
function RequesterAvatar(props) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!props.imageUrl || imageFailed) {
    return (
      <span
        className={`${props.className} requester-avatar-fallback`}
        aria-hidden="true"
      >
        {getInitials(props.name)}
      </span>
    )
  }

  return (
    <img
      className={props.className}
      src={props.imageUrl}
      alt=""
      onError={() => setImageFailed(true)}
    />
  )
}

export default RequesterAvatar

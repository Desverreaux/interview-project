import { useState } from 'react'

function getInitials(name) {
  const nameParts = name.trim().split(/\s+/)
  const firstLetters = nameParts.slice(0, 2).map((part) => part[0])

  return firstLetters.join('').toUpperCase()
}

async function verifyCredentials(technician, password) {
  // Demo-only: accept any non-empty password without storing or sending it.
  return Boolean(technician) && password.length > 0
}

// Collects a demo technician choice and reports it to App; it does not authenticate.
function LoginPage(props) {
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [password, setPassword] = useState('')
  const [verificationError, setVerificationError] = useState('')

  function selectAccount(technician) {
    setSelectedTechnician(technician)
    setPassword('')
    setVerificationError('')
  }

  function returnToAccountList() {
    setSelectedTechnician(null)
    setPassword('')
    setVerificationError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setVerificationError('')

    const isVerified = await verifyCredentials(selectedTechnician, password)

    if (!isVerified) {
      setVerificationError('Enter a password to continue.')
      return
    }

    setPassword('')
    props.onSelect(selectedTechnician)
  }

  return (
    <main className="login-page">
      <header className="login-page__intro">
        <p className="login-page__eyebrow">IT Help Desk</p>
        <h1 className="login-page__title">
          {selectedTechnician
            ? `Welcome, ${selectedTechnician.name}`
            : 'Choose an account'}
        </h1>
        <p className="login-page__subtitle">
          {selectedTechnician
            ? 'Sign in to continue to your staff profile.'
            : 'Select a staff profile to continue.'}
        </p>
      </header>

      {props.isLoading ? (
        <p className="ticket-state" role="status">
          Loading staff accounts...
        </p>
      ) : props.error ? (
        <div className="ticket-state ticket-state--error" role="alert">
          <p>{props.error}</p>
          <button
            className="ticket-state__retry"
            type="button"
            onClick={props.onRetry}
          >
            Try again
          </button>
        </div>
      ) : selectedTechnician ? (
        <>
          <section className="login-selected-user" aria-label="Selected account">
            <span className="login-user-avatar" aria-hidden="true">
              {getInitials(selectedTechnician.name)}
            </span>
            <span className="login-selected-user__details">
              <span className="login-selected-user__name">
                {selectedTechnician.name}
              </span>
              <span className="login-user-role">
                {selectedTechnician.role}
                {selectedTechnician.teamName
                  ? ` · ${selectedTechnician.teamName}`
                  : ''}
              </span>
            </span>
            <button
              className="login-change-user"
              type="button"
              onClick={returnToAccountList}
            >
              Change
            </button>
          </section>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-form__label" htmlFor="login-password">
              Password
            </label>
            <input
              autoComplete="off"
              autoFocus
              className="login-form__input"
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {verificationError && (
              <p className="login-form__error" role="alert">
                {verificationError}
              </p>
            )}
            <button className="login-form__submit" type="submit">
              Sign in
            </button>
          </form>
        </>
      ) : (
        <section className="login-user-list" aria-label="Staff accounts">
          {props.technicians.length === 0 ? (
            <p className="ticket-state" role="status">
              No staff accounts are available.
            </p>
          ) : (
            props.technicians.map((technician) => (
              <button
                key={technician.id}
                className="login-user-option"
                type="button"
                onClick={() => selectAccount(technician)}
              >
                <span className="login-user-avatar" aria-hidden="true">
                  {getInitials(technician.name)}
                </span>
                <span className="login-user-details">
                  <span className="login-user-name">{technician.name}</span>
                  <span className="login-user-role">
                    {technician.role}
                    {technician.teamName ? ` · ${technician.teamName}` : ''}
                  </span>
                </span>
              </button>
            ))
          )}
        </section>
      )}

      {props.selectionError && (
        <p className="ticket-state ticket-state--error" role="alert">
          {props.selectionError}
        </p>
      )}

      <p className="login-page__note">
        Demo sign-in only. Any non-empty password works and is not sent or
        saved.
      </p>
    </main>
  )
}

export default LoginPage

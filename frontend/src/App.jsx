import { useEffect, useRef, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { getTickets, updateTicket } from './api/tickets.js'
import {
  getTechnicians,
  getTeams,
  updateTechnician,
} from './api/technicians.js'
import AboutPage from './AboutPage.jsx'
import BottomNavigation from './BottomNavigation.jsx'
import LoginPage from './LoginPage.jsx'
import TicketCard from './TicketCard.jsx'
import TicketDetails from './TicketDetails.jsx'
import TechnicianProfile from './TechnicianProfile.jsx'
import navigationItems from './navigationItems.js'

// This remembers the selected demo profile; it does not authenticate the user.
const selectedTechnicianStorageKey = 'helpdesk.selectedTechnicianId'

/**
 * Coordinates shared API data and page state. Child components render focused
 * views and send changes back through callbacks so updates stay consistent.
 */
function App() {
  // Shared records are kept here because tickets, details, and profile views overlap.
  const [ticketList, setTicketList] = useState([])
  // Store the selected ID, then derive the current ticket from the latest list data.
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [activePage, setActivePage] = useState('tickets')
  const [pageTransitionDirection, setPageTransitionDirection] = useState(null)
  const [myTicketsView, setMyTicketsView] = useState('assigned')
  const [technician, setTechnician] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [teams, setTeams] = useState([])
  const [loginError, setLoginError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [isTechnicianLoading, setIsTechnicianLoading] = useState(true)
  const [technicianLoadError, setTechnicianLoadError] = useState('')
  const [technicianRetryCount, setTechnicianRetryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDraggingPage, setIsDraggingPage] = useState(false)
  const touchStartRef = useRef(null)
  const suppressClickRef = useRef(false)
  const selectedTicket = ticketList.find(
    (ticket) => ticket.id === selectedTicketId,
  )
  const activeTabIndex = navigationItems.findIndex(
    (item) => item.id === activePage,
  )
  const swipePreviewIndex =
    activeTabIndex + (swipeOffset < 0 ? 1 : -1)
  const swipePreviewItem =
    swipeOffset === 0 ? null : navigationItems[swipePreviewIndex]

  useEffect(() => {
    // Retry changes restart this load; cleanup prevents a stale response updating state.
    const controller = new AbortController()

    async function loadTickets() {
      setIsLoading(true)
      setLoadError('')

      try {
        const tickets = await getTickets(controller.signal)
        setTicketList(tickets)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : 'Could not load tickets.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadTickets()

    return () => controller.abort()
  }, [retryCount])

  useEffect(() => {
    // Load these together so a partial response cannot leave profile/team data inconsistent.
    const controller = new AbortController()

    async function loadTechnicians() {
      setIsTechnicianLoading(true)
      setTechnicianLoadError('')

      try {
        const [technicians, availableTeams] = await Promise.all([
          getTechnicians(controller.signal),
          getTeams(controller.signal),
        ])
        // Resolve the saved ID only after the API has supplied the current account list.
        let savedTechnicianId

        try {
          savedTechnicianId = window.localStorage.getItem(
            selectedTechnicianStorageKey,
          )
        } catch {
          throw new Error('Could not read the saved account selection.')
        }

        const savedTechnician = technicians.find(
          (currentTechnician) =>
            currentTechnician.id === Number(savedTechnicianId),
        )

        setTechnician(savedTechnician || null)
        setTechnicians(technicians)
        setTeams(availableTeams)
      } catch (error) {
        if (!controller.signal.aborted) {
          setTechnicianLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load technician data.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsTechnicianLoading(false)
        }
      }
    }

    loadTechnicians()

    return () => controller.abort()
  }, [technicianRetryCount])

  function toggleFavorite(ticketId) {
    // Favorites are currently client-side state; ticket edits use the API below.
    setTicketList((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, isFavorite: !ticket.isFavorite }
          : ticket,
      ),
    )
  }

  async function saveTicket(updatedTicket) {
    // Treat the API response as canonical, then replace the matching list item.
    const savedTicket = await updateTicket(updatedTicket)

    setTicketList((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === savedTicket.id ? savedTicket : ticket,
      ),
    )
    return savedTicket
  }

  async function completeTicket(ticketToComplete) {
    await saveTicket({ ...ticketToComplete, status: 'Resolved' })
    navigateTo('tickets')
  }

  async function saveTechnician(updatedTechnician) {
    // Update both references so the profile and account-dependent views stay in sync.
    const savedTechnician = await updateTechnician(updatedTechnician)
    setTechnician(savedTechnician)
    setTechnicians((currentTechnicians) =>
      currentTechnicians.map((currentTechnician) =>
        currentTechnician.id === savedTechnician.id
          ? savedTechnician
          : currentTechnician,
      ),
    )
    return savedTechnician
  }

  function navigateTo(page) {
    const currentTabIndex = navigationItems.findIndex(
      (item) => item.id === activePage,
    )
    const nextTabIndex = navigationItems.findIndex(
      (item) => item.id === page,
    )

    if (currentTabIndex !== nextTabIndex && nextTabIndex >= 0) {
      setPageTransitionDirection(
        nextTabIndex > currentTabIndex ? 'forward' : 'backward',
      )
    }

    // Close ticket details so the destination tab is visible after navigation.
    setSelectedTicketId(null)
    setSwipeOffset(0)
    setIsDraggingPage(false)
    setActivePage(page)
  }

  function handleTouchStart(event) {
    setSwipeOffset(0)
    setIsDraggingPage(false)

    if (selectedTicket || event.touches.length !== 1) {
      touchStartRef.current = null
      return
    }

    // Inputs and editable controls keep their normal touch behavior.
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    ) {
      touchStartRef.current = null
      return
    }

    const touch = event.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      width: event.currentTarget.clientWidth,
      isHorizontal: false,
      offset: 0,
    }
  }

  function handleTouchMove(event) {
    const touchStart = touchStartRef.current

    if (!touchStart || selectedTicket || event.touches.length !== 1) {
      return
    }

    const touch = event.touches[0]
    const horizontalDistance = touch.clientX - touchStart.x
    const verticalDistance = touch.clientY - touchStart.y

    if (!touchStart.isHorizontal) {
      if (Math.abs(horizontalDistance) < 8) {
        return
      }

      // Let vertical movement scroll the page instead of turning it into a tab swipe.
      if (Math.abs(horizontalDistance) <= Math.abs(verticalDistance) * 1.15) {
        if (Math.abs(verticalDistance) > 8) {
          touchStartRef.current = null
        }
        return
      }

      touchStart.isHorizontal = true
    }

    const currentTabIndex = navigationItems.findIndex(
      (item) => item.id === activePage,
    )
    const nextTabIndex = currentTabIndex + (horizontalDistance < 0 ? 1 : -1)
    const hasAdjacentTab =
      nextTabIndex >= 0 && nextTabIndex < navigationItems.length
    // Resist movement at the ends of the tab list to signal that no tab is available.
    const resistedDistance = hasAdjacentTab
      ? horizontalDistance
      : horizontalDistance * 0.25
    const width = Math.max(touchStart.width, 1)
    const offset = Math.max(-width, Math.min(width, resistedDistance))

    touchStart.offset = offset
    setSwipeOffset(offset)
    setIsDraggingPage(true)
  }

  function handleTouchEnd() {
    const touchStart = touchStartRef.current
    touchStartRef.current = null

    if (!touchStart || selectedTicket || !touchStart.isHorizontal) {
      setSwipeOffset(0)
      setIsDraggingPage(false)
      return
    }

    const offset = touchStart.offset
    const currentTabIndex = navigationItems.findIndex(
      (item) => item.id === activePage,
    )
    const nextTabIndex = currentTabIndex + (offset < 0 ? 1 : -1)
    // Scale the swipe distance to the viewport while keeping a minimum threshold.
    const swipeThreshold = Math.max(70, touchStart.width * 0.18)

    if (Math.abs(offset) >= 24) {
      // Touch browsers can synthesize a click after a drag; suppress that click.
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }

    if (
      Math.abs(offset) >= swipeThreshold &&
      nextTabIndex >= 0 &&
      nextTabIndex < navigationItems.length
    ) {
      navigateTo(navigationItems[nextTabIndex].id)
    } else {
      setSwipeOffset(0)
      setIsDraggingPage(false)
    }
  }

  function handleClickCapture(event) {
    if (!suppressClickRef.current) {
      return
    }

    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  function selectTechnician(selectedTechnician) {
    try {
      window.localStorage.setItem(
        selectedTechnicianStorageKey,
        String(selectedTechnician.id),
      )
    } catch {
      setLoginError(
        'Could not save your account selection in this browser. Check its storage settings and try again.',
      )
      return
    }

    // Persist only the demo profile ID; the password is not part of this flow.
    setLoginError('')
    setTechnician(selectedTechnician)
    setActivePage('tickets')
  }

  function signOut() {
    try {
      window.localStorage.removeItem(selectedTechnicianStorageKey)
    } catch {
      setAccountError(
        'Could not sign out because browser storage is unavailable.',
      )
      return
    }

    // Clear the demo selection before returning to the account picker.
    setAccountError('')
    setTechnician(null)
    setSelectedTicketId(null)
    setActivePage('tickets')
  }

  // Keep the app behind the account picker until the profile data is ready.
  if (isTechnicianLoading || technicianLoadError || !technician) {
    return (
      <div className="app-shell">
        <LoginPage
          technicians={technicians}
          isLoading={isTechnicianLoading}
          error={technicianLoadError}
          selectionError={loginError}
          onRetry={() =>
            setTechnicianRetryCount((currentCount) => currentCount + 1)
          }
          onSelect={selectTechnician}
        />
      </div>
    )
  }

  let pageContent

  if (selectedTicket) {
    pageContent = (
      <TicketDetails
        ticket={selectedTicket}
        technicians={technicians}
        teams={teams}
        technicianId={technician.id}
        isTechniciansLoading={isTechnicianLoading}
        backLabel={
          activePage === 'my-tickets'
            ? myTicketsView === 'teams'
              ? 'Back to team tickets'
              : 'Back to my tickets'
            : 'Back to all tickets'
        }
        isFavorite={selectedTicket.isFavorite}
        onBack={() => setSelectedTicketId(null)}
        onToggleFavorite={() => toggleFavorite(selectedTicket.id)}
        onComplete={completeTicket}
        onSave={saveTicket}
      />
    )
  } else if (activePage === 'about') {
    pageContent = <AboutPage />
  } else if (activePage === 'profile') {
    if (technicianLoadError) {
      pageContent = (
        <main className="ticket-page">
          <h1>Technician Profile</h1>
          <div className="ticket-state ticket-state--error" role="alert">
            <p>{technicianLoadError}</p>
            <button
              className="ticket-state__retry"
              type="button"
              onClick={() =>
                setTechnicianRetryCount((currentCount) => currentCount + 1)
              }
            >
              Try again
            </button>
          </div>
        </main>
      )
    } else if (isTechnicianLoading || !technician) {
      pageContent = (
        <main className="ticket-page">
          <h1>Technician Profile</h1>
          <p className="ticket-state" role="status">
            Loading technician profile...
          </p>
        </main>
      )
    } else {
      pageContent = (
        <TechnicianProfile
          technician={technician}
          teams={teams}
          accountError={accountError}
          onSignOut={signOut}
          onSave={saveTechnician}
        />
      )
    }
  } else if (activePage === 'my-tickets') {
    // Resolved tickets are history, not active work in either My Tickets view.
    const assignedTickets = ticketList.filter(
      (ticket) =>
        ticket.status !== 'Resolved' &&
        ticket.assignedTechnicianId === technician.id,
    )
    let technicianTeamIds

    if (Array.isArray(technician.teamIds)) {
      technicianTeamIds = technician.teamIds
    } else if (technician.teamId) {
      technicianTeamIds = [technician.teamId]
    } else {
      technicianTeamIds = []
    }

    const technicianTeamNames =
      technician.teamNames?.join(', ') || technician.teamName || 'your teams'
    const teamTickets = ticketList.filter(
      (ticket) =>
        ticket.status !== 'Resolved' &&
        technicianTeamIds.includes(ticket.teamId),
    )
    const showingTeamTickets = myTicketsView === 'teams'
    const visibleTickets = showingTeamTickets ? teamTickets : assignedTickets

    let ticketListContent

    if (isTechnicianLoading || isLoading) {
      ticketListContent = (
        <p className="ticket-state" role="status">
          Loading tickets...
        </p>
      )
    } else if (loadError) {
      ticketListContent = (
        <div className="ticket-state ticket-state--error" role="alert">
          <p>{loadError}</p>
          <button
            className="ticket-state__retry"
            type="button"
            onClick={() => setRetryCount((currentCount) => currentCount + 1)}
          >
            Try again
          </button>
        </div>
      )
    } else if (technicianLoadError || !technician) {
      ticketListContent = (
        <div className="ticket-state ticket-state--error" role="alert">
          <p>
            {technicianLoadError || 'No current technician is configured.'}
          </p>
          <button
            className="ticket-state__retry"
            type="button"
            onClick={() =>
              setTechnicianRetryCount((currentCount) => currentCount + 1)
            }
          >
            Try again
          </button>
        </div>
      )
    } else {
      ticketListContent = (
        <section
          className="ticket-list"
          aria-label={
            showingTeamTickets ? "Tickets for your teams" : "Tickets assigned to you"
          }
        >
          {visibleTickets.length === 0 ? (
            <p className="ticket-state" role="status">
              {showingTeamTickets
                ? 'No active tickets are in your teams.'
                : 'No active tickets are assigned to you.'}
            </p>
          ) : (
            visibleTickets.map((currentTicket, index) => (
              <TicketCard
                key={currentTicket.id}
                ticket={currentTicket}
                animationIndex={index}
                onSelect={() => setSelectedTicketId(currentTicket.id)}
              />
            ))
          )}
        </section>
      )
    }

    pageContent = (
      <main className="ticket-page">
        <h1>My Tickets</h1>
        <div className="my-tickets-tabs" role="group" aria-label="Ticket view">
          <button
            className={`my-tickets-tabs__button${showingTeamTickets ? '' : ' is-active'}`}
            type="button"
            aria-pressed={!showingTeamTickets}
            onClick={() => setMyTicketsView('assigned')}
          >
            My Tickets
          </button>
          <button
            className={`my-tickets-tabs__button${showingTeamTickets ? ' is-active' : ''}`}
            type="button"
            aria-pressed={showingTeamTickets}
            onClick={() => setMyTicketsView('teams')}
          >
            Team Tickets
          </button>
        </div>
        <p className="my-tickets-caption">
          {showingTeamTickets
            ? `Tickets for ${technicianTeamNames}`
            : `Assigned to ${technician.name}`}
        </p>
        {ticketListContent}
      </main>
    )
  } else if (isLoading) {
    pageContent = (
      <main className="ticket-page">
        <h1>All Tickets</h1>
        <p className="ticket-state" role="status">
          Loading tickets...
        </p>
      </main>
    )
  } else if (loadError) {
    pageContent = (
      <main className="ticket-page">
        <h1>All Tickets</h1>
        <div className="ticket-state ticket-state--error" role="alert">
          <p>{loadError}</p>
          <button
            className="ticket-state__retry"
            type="button"
            onClick={() => setRetryCount((currentCount) => currentCount + 1)}
          >
            Try again
          </button>
        </div>
      </main>
    )
  } else {
    // Keep active work first and completed tickets in a separate section below it.
    const activeTickets = ticketList.filter(
      (ticket) => ticket.status !== 'Resolved',
    )
    const completedTickets = ticketList.filter(
      (ticket) => ticket.status === 'Resolved',
    )

    pageContent = (
      <main className="ticket-page">
        <h1>All Tickets</h1>
        <section className="ticket-list" aria-label="Active support tickets">
          {activeTickets.length === 0 ? (
            <p className="ticket-state" role="status">
              {completedTickets.length > 0
                ? 'No active tickets.'
                : 'No tickets yet.'}
            </p>
          ) : (
            activeTickets.map((currentTicket, index) => (
              <TicketCard
                key={currentTicket.id}
                ticket={currentTicket}
                animationIndex={index}
                onSelect={() => setSelectedTicketId(currentTicket.id)}
              />
            ))
          )}
        </section>
        {completedTickets.length > 0 && (
          <section
            className="ticket-completed-section"
            aria-labelledby="completed-tickets-heading"
          >
            <h2
              className="ticket-completed-section__heading"
              id="completed-tickets-heading"
            >
              Completed
            </h2>
            <div className="ticket-list" aria-label="Completed tickets">
              {completedTickets.map((currentTicket, index) => (
                <TicketCard
                  key={currentTicket.id}
                  ticket={currentTicket}
                  animationIndex={activeTickets.length + index}
                  onSelect={() => setSelectedTicketId(currentTicket.id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    )
  }

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null
        setSwipeOffset(0)
        setIsDraggingPage(false)
      }}
      onClickCapture={handleClickCapture}
    >
      <div
        className="page-transition-viewport"
        style={{ '--swipe-offset': `${swipeOffset}px` }}
      >
        {swipePreviewItem && (
          <div
            className={`page-swipe-preview page-swipe-preview--${
              swipeOffset < 0 ? 'next' : 'previous'
            }`}
            aria-hidden="true"
          >
            <span className="page-swipe-preview__label">
              <span>{swipeOffset < 0 ? '←' : '→'}</span>
              {swipePreviewItem.label}
            </span>
          </div>
        )}
        <div
          key={activePage}
          className={`page-transition${
            isDraggingPage ? ' is-dragging' : ''
          }${
            pageTransitionDirection
              ? ` page-transition--${pageTransitionDirection}`
              : ''
          }`}
        >
          {pageContent}
        </div>
      </div>
      <BottomNavigation activePage={activePage} onNavigate={navigateTo} />
    </div>
  )
}

export default App

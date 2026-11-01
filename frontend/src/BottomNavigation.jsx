import navigationItems from './navigationItems.js'

// Renders the shared navigation model and lets App own the active-page state.
function BottomNavigation(props) {
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          className={`bottom-navigation__item${
            props.activePage === item.id ? ' is-active' : ''
          }`}
          type="button"
          aria-current={props.activePage === item.id ? 'page' : undefined}
          onClick={() => props.onNavigate(item.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {item.id === 'tickets' ? (
              <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </>
            ) : item.id === 'my-tickets' ? (
              <>
                <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
                <path d="M14 3.5V8h4M8 13h8M8 17h4" />
              </>
            ) : item.id === 'profile' ? (
              <>
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 20c.5-3.5 3.2-5.3 7-5.3s6.5 1.8 7 5.3" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5m0-8h.01" />
              </>
            )}
          </svg>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNavigation

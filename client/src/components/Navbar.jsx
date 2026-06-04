import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useTrialStatus } from '../hooks/useTrialStatus';

const NAV_ITEMS = [
  { label: 'Clients', path: '/dashboard' },
  { label: 'Feedback', path: '/dashboard/feedback' },
  { label: 'Email', path: '/dashboard/email' },
  { label: 'Invoices', path: '/dashboard/invoices' },
  { label: 'Receipts', path: '/dashboard/receipts' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const { studioName } = useStudioProfile();
  const { isLoaded: trialLoaded, plan, daysLeft } = useTrialStatus();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(path) {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function handleNavigate(path) {
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="navbar-container"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Studio Name */}
        <button
          className="navbar-logo"
          onClick={() => handleNavigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
            padding: 0,
            cursor: 'pointer',
            zIndex: 101,
          }}
        >
          {studioName}
        </button>

        {/* Desktop Navigation Links */}
        <div className="navbar-links desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive(item.path)
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                borderBottom: isActive(item.path)
                  ? '1.5px solid var(--color-text-primary)'
                  : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: 'var(--color-border)',
            }}
          />

          {/* Trial badge */}
          {trialLoaded && (
            <div
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                ...(plan === 'pro'
                  ? {
                      backgroundColor: 'var(--color-accent-gold)',
                      color: '#fff',
                    }
                  : daysLeft <= 7
                  ? {
                      backgroundColor: '#fef3cd',
                      color: '#856404',
                    }
                  : {
                      backgroundColor: 'var(--color-bg-warm)',
                      color: 'var(--color-text-muted)',
                    }),
              }}
            >
              {plan === 'pro' ? 'PRO' : `${daysLeft} days left`}
            </div>
          )}

          <button
            onClick={() => handleNavigate('/profile')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: location.pathname === '/profile'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-faint)',
              transition: 'color 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>

          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              transition: 'color 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <button
          className="burger-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>

        {/* Mobile Dropdown Menu Drawer */}
        {menuOpen && (
          <div className="mobile-drawer">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive(item.path)
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderBottom: isActive(item.path)
                    ? '2px solid var(--color-accent-gold)'
                    : 'none',
                }}
              >
                {item.label}
              </button>
            ))}

            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: 'var(--color-border)',
                margin: '8px 0',
              }}
            />

            {/* Profile */}
            <button
              onClick={() => handleNavigate('/profile')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: location.pathname === '/profile'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </button>

            {/* Trial Info */}
            {trialLoaded && (
              <div
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  ...(plan === 'pro'
                    ? {
                        backgroundColor: 'var(--color-accent-gold)',
                        color: '#fff',
                      }
                    : daysLeft <= 7
                    ? {
                        backgroundColor: '#fef3cd',
                        color: '#856404',
                      }
                    : {
                        backgroundColor: 'var(--color-bg-warm)',
                        color: 'var(--color-text-muted)',
                      }),
                }}
              >
                {plan === 'pro' ? 'PRO PLAN' : `${daysLeft} DAYS TRIAL LEFT`}
              </div>
            )}

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#dc3545',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 24,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

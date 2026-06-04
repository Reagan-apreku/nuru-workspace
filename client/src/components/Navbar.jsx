import { useNavigate, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useTrialStatus } from '../hooks/useTrialStatus';

const NAV_ITEMS = [
  { label: 'Clients', path: '/dashboard' },
  { label: 'Feedback', path: '/dashboard/feedback' },
  { label: 'Email', path: '/dashboard/email' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const { studioName } = useStudioProfile();
  const { isLoaded: trialLoaded, plan, daysLeft } = useTrialStatus();

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
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
            padding: 0,
          }}
        >
          {studioName}
        </button>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
            onClick={() => navigate('/profile')}
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
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => {
              if (location.pathname !== '/profile') {
                e.currentTarget.style.color = 'var(--color-text-faint)';
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
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
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

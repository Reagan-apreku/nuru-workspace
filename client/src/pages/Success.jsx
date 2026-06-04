import { useNavigate } from 'react-router-dom';
import { useStudioProfile } from '../hooks/useStudioProfile';

export default function Success() {
  const navigate = useNavigate();
  const { studioName } = useStudioProfile();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          textAlign: 'center',
          maxWidth: 480,
          opacity: 0,
        }}
      >
        {/* Checkmark */}
        <div
          className="animate-scale-in"
          style={{
            fontSize: 80,
            color: 'var(--color-accent-gold)',
            marginBottom: 32,
            opacity: 0,
            animationDelay: '0.2s',
          }}
        >
          ✓
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48,
            fontWeight: 300,
            color: 'var(--color-text-primary)',
            marginBottom: 16,
            letterSpacing: '0.02em',
          }}
        >
          Thank you.
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: 16,
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            marginBottom: 48,
            fontWeight: 300,
          }}
        >
          Your details have been saved.<br />
          Thank you for choosing {studioName}.
        </p>

        {/* Device return notice */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-faint)',
            marginBottom: 56,
            fontStyle: 'italic',
          }}
        >
          Please return the device to your photographer.
        </p>

        {/* Admin actions — intentionally subtle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          <button
            className="btn-text"
            onClick={() => navigate('/new-client')}
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
          >
            New Client
          </button>
          <button
            className="btn-text"
            onClick={() => navigate('/dashboard')}
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

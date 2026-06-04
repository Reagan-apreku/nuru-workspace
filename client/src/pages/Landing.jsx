import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Show, UserButton } from '@clerk/react';

const GALLERY_WORDS = ['Portraits', 'Weddings', 'Moments', 'Stories', 'Memories'];

/**
 * Decorative aperture ring — subtle visual motif behind the hero.
 */
function ApertureRing() {
  return (
    <svg
      viewBox="0 0 400 400"
      style={{
        position: 'absolute',
        width: 'min(500px, 80vw)',
        height: 'min(500px, 80vw)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.04,
        pointerEvents: 'none',
      }}
    >
      <circle cx="200" cy="200" r="180" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
      <circle cx="200" cy="200" r="140" fill="none" stroke="#1a1a1a" strokeWidth="0.3" />
      <circle cx="200" cy="200" r="100" fill="none" stroke="#1a1a1a" strokeWidth="0.3" />
      {/* Aperture blades */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line
          key={angle}
          x1="200"
          y1="20"
          x2="200"
          y2="380"
          stroke="#1a1a1a"
          strokeWidth="0.3"
          transform={`rotate(${angle} 200 200)`}
        />
      ))}
    </svg>
  );
}

/**
 * Feature icons as minimal SVGs.
 */
const FEATURE_ICONS = {
  intake: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  feedback: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  newsletters: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  dashboard: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
};

export default function Landing() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % GALLERY_WORDS.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation */}
      <header
        style={{
          padding: '0 48px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
          }}
        >
          Nuru Workspace
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Show when="signed-out">
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/sign-up')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            >
              Sign Up
            </button>
          </Show>
          <Show when="signed-in">
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            >
              Dashboard
            </button>
            <UserButton />
          </Show>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background aperture motif */}
        <ApertureRing />

        <div
          className="animate-fade-in-up"
          style={{
            textAlign: 'center',
            maxWidth: 720,
            opacity: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Gold accent line */}
          <div
            style={{
              width: 48,
              height: 1,
              backgroundColor: 'var(--color-accent-gold)',
              margin: '0 auto 32px',
            }}
          />

          {/* Eyebrow */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              marginBottom: 40,
            }}
          >
            Photography Management
          </p>

          {/* Main heading */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 7vw, 84px)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            We capture
          </h1>

          {/* Rotating word */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 7vw, 84px)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.1,
              color: 'var(--color-accent-gold)',
              marginBottom: 48,
              letterSpacing: '-0.01em',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.4s ease',
            }}
          >
            {GALLERY_WORDS[wordIndex]}
          </h1>

          {/* Gold accent line */}
          <div
            style={{
              width: 48,
              height: 1,
              backgroundColor: 'var(--color-accent-gold)',
              margin: '0 auto 40px',
              opacity: 0.5,
            }}
          />

          {/* Subtitle */}
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
              maxWidth: 440,
              margin: '0 auto 56px',
              fontWeight: 300,
            }}
          >
            A refined system for the modern photography studio.
            Intake, feedback, and communications — all in one place.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <Show when="signed-out">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ height: 48, padding: '0 36px', fontSize: 13 }}
              >
                Sign In
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/sign-up')}
                style={{ height: 48, padding: '0 36px', fontSize: 13 }}
              >
                Create Account
              </button>
            </Show>
            <Show when="signed-in">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{ height: 48, padding: '0 36px', fontSize: 13 }}
              >
                Go to Dashboard
              </button>
            </Show>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '80px 48px',
          backgroundColor: 'var(--color-bg-surface)',
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 48,
          }}
        >
          {[
            {
              icon: 'intake',
              title: 'Client Intake',
              desc: 'Seamless check-in forms designed for iPad handoff at any stage of the session.',
            },
            {
              icon: 'feedback',
              title: 'Feedback',
              desc: 'Collect ratings and testimonials to continuously refine the studio experience.',
            },
            {
              icon: 'newsletters',
              title: 'Newsletters',
              desc: 'Send beautifully formatted emails and newsletters to keep clients engaged.',
            },
            {
              icon: 'dashboard',
              title: 'Dashboard',
              desc: 'A clean overview of clients, feedback, and communication history.',
            },
          ].map((feature, idx) => (
            <div
              key={feature.title}
              className="animate-fade-in"
              style={{
                opacity: 0,
                animationDelay: `${idx * 100}ms`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  color: 'var(--color-accent-gold)',
                  marginBottom: 20,
                }}
              >
                {FEATURE_ICONS[feature.icon]}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 400,
                  color: 'var(--color-text-primary)',
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--color-text-muted)',
                  fontWeight: 300,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 48px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-faint)',
            letterSpacing: '0.04em',
          }}
        >
          © {new Date().getFullYear()} Nuru Workspace
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-faint)',
            letterSpacing: '0.04em',
          }}
        >
          Photography Management System
        </span>
      </footer>
    </div>
  );
}

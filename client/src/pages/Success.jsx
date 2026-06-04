import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudioProfile } from '../hooks/useStudioProfile';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('source') === 'shared';
  const photographerId = searchParams.get('photographer');
  const { studioName: loggedInStudioName, logoUrl: loggedInLogoUrl } = useStudioProfile();

  const [brand, setBrand] = useState({
    studioName: 'Nuru Workspace',
    logoUrl: null,
  });

  useEffect(() => {
    if (isShared && photographerId) {
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/clients/photographer/${photographerId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch public brand');
          return res.json();
        })
        .then((data) => {
          setBrand({
            studioName: data.studioName || 'Nuru Workspace',
            logoUrl: data.logoUrl || null,
          });
        })
        .catch((err) => {
          console.error('Failed to load photographer brand on success page:', err);
          setBrand({
            studioName: 'Nuru Workspace',
            logoUrl: null,
          });
        });
    } else {
      setBrand({
        studioName: loggedInStudioName || 'Nuru Workspace',
        logoUrl: loggedInLogoUrl || null,
      });
    }
  }, [isShared, photographerId, loggedInStudioName, loggedInLogoUrl]);

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
        {/* Brand Logo */}
        {brand.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <img
              src={brand.logoUrl}
              alt={brand.studioName}
              style={{
                maxHeight: 64,
                maxWidth: 160,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

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
          Thank you for choosing {brand.studioName}.
        </p>

        {/* Device return notice */}
        {!isShared && (
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
        )}

        {/* Admin actions — intentionally subtle */}
        {!isShared && (
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
        )}
      </div>
    </div>
  );
}

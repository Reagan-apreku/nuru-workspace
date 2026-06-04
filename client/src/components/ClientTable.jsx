import { useState } from 'react';

/**
 * Reusable premium Copy Button component
 */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        color: copied ? 'var(--color-success)' : 'var(--color-text-faint)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        borderRadius: 4,
        transition: 'all 0.2s ease',
        verticalAlign: 'middle',
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={(e) => {
        if (!copied) e.currentTarget.style.color = 'var(--color-text-faint)';
      }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
}

/**
 * Format date for display in tables and lists
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Render star rating as gold stars
 */
function renderStars(rating) {
  if (!rating) return '—';
  const val = parseFloat(rating);
  return (
    <span style={{ color: 'var(--color-accent-gold)', letterSpacing: 2 }}>
      {'★'.repeat(Math.round(val))}
      {'☆'.repeat(5 - Math.round(val))}
    </span>
  );
}

export default function ClientTable({ clients, onNewClient }) {
  if (!clients || clients.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 0',
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
          fontSize: 16,
        }}
      >
        No clients yet.
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 700,
          }}
        >
          <thead>
            <tr>
              {['Name', 'Email', 'Phone', 'Shoot Type', 'Date', 'Rating'].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: 'left',
                    padding: '0 16px 16px',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-faint)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, idx) => (
              <tr
                key={client.id}
                className="animate-fade-in"
                style={{
                  opacity: 0,
                  animationDelay: `${idx * 30}ms`,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {client.first_name} {client.last_name}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ verticalAlign: 'middle' }}>{client.email}</span>
                  <CopyButton text={client.email} />
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ verticalAlign: 'middle' }}>{client.phone || '—'}</span>
                  {client.phone && <CopyButton text={client.phone} />}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-bg-surface)',
                      padding: '4px 10px',
                      borderRadius: 3,
                    }}
                  >
                    {client.shoot_type}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    fontSize: 14,
                  }}
                >
                  {formatDate(client.created_at)}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 14,
                  }}
                >
                  {renderStars(client.avg_rating)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
                  }}
                >
                  {client.email}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {client.phone || '—'}
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

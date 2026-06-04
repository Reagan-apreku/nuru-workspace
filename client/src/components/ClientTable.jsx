import { useState } from 'react';
import { useDeleteClient } from '../hooks/useApi';

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

function getClientStatus(client) {
  if (client.avg_rating !== undefined && client.avg_rating !== null) {
    return {
      text: 'Reviewed',
      bgColor: '#eafaf1',
      color: '#11a355',
    };
  }
  
  const createdDate = new Date(client.created_at);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) {
    return {
      text: 'New',
      bgColor: '#e8f4fd',
      color: '#1a73e8',
    };
  }

  return {
    text: 'Pending Review',
    bgColor: '#fff8e6',
    color: '#b27b00',
  };
}

export default function ClientTable({ clients, onNewClient }) {
  const deleteClient = useDeleteClient();

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove any reviews they submitted.`)) {
      try {
        await deleteClient.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete client:', err);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

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
      {/* Desktop/Tablet Table View */}
      <div
        className="desktop-only"
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
              {['Name', 'Email', 'Phone', 'Shoot Type', 'Status', 'Date', 'Rating', ''].map((header) => (
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
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    fontSize: 14,
                  }}
                >
                  {client.first_name} {client.last_name}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{client.email}</span>
                    <CopyButton text={client.email} />
                  </div>
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 14,
                  }}
                >
                  {client.phone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{client.phone}</span>
                      <CopyButton text={client.phone} />
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-faint)', fontStyle: 'italic' }}>—</span>
                  )}
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
                  {client.shoot_type}
                </td>
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {(() => {
                    const status = getClientStatus(client);
                    return (
                      <span
                        style={{
                          backgroundColor: status.bgColor,
                          color: status.color,
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          display: 'inline-block',
                        }}
                      >
                        {status.text}
                      </span>
                    );
                  })()}
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
                <td
                  style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid var(--color-border)',
                    textAlign: 'right',
                  }}
                >
                  <button
                    onClick={() => handleDelete(client.id, `${client.first_name} ${client.last_name}`)}
                    title="Delete Client"
                    disabled={deleteClient.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      color: 'var(--color-text-faint)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-error)';
                      e.currentTarget.style.backgroundColor = '#fef2f1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-faint)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="mobile-only" style={{ display: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {clients.map((client, idx) => (
            <div
              key={client.id}
              className="animate-fade-in"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 8,
                padding: 20,
                border: '1px solid var(--color-border)',
                opacity: 0,
                animationDelay: `${idx * 40}ms`,
              }}
            >
              {/* Header: Name, Status & Delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 550, color: 'var(--color-text-primary)' }}>
                    {client.first_name} {client.last_name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent-gold)',
                      }}
                    >
                      {client.shoot_type}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>•</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatDate(client.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Delete button & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const status = getClientStatus(client);
                    return (
                      <span
                        style={{
                          backgroundColor: status.bgColor,
                          color: status.color,
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          display: 'inline-block',
                        }}
                      >
                        {status.text}
                      </span>
                    );
                  })()}
                  
                  <button
                    onClick={() => handleDelete(client.id, `${client.first_name} ${client.last_name}`)}
                    title="Delete Client"
                    disabled={deleteClient.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      color: 'var(--color-text-faint)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contact Details (Email/Phone) */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                    {client.email}
                  </span>
                  <CopyButton text={client.email} />
                </div>
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {client.phone}
                    </span>
                    <CopyButton text={client.phone} />
                  </div>
                )}
              </div>

              {/* Rating stars if available */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Rating</span>
                <div style={{ fontSize: 12 }}>
                  {renderStars(client.avg_rating)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

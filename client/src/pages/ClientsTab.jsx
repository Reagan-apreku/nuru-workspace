import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { useClients } from '../hooks/useApi';
import ClientTable from '../components/ClientTable';

function ShareIntakeButton() {
  const [copied, setCopied] = useState(false);
  const { user } = useUser();

  const handleShare = async () => {
    try {
      const photographerId = user?.id || '';
      const url = `${window.location.origin}/new-client?source=shared&photographer=${photographerId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      className="btn"
      onClick={handleShare}
      style={{
        backgroundColor: copied ? 'var(--color-success)' : 'var(--color-bg-surface)',
        color: copied ? '#fff' : 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        marginRight: 12,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 38,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Link Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Share Intake Link
        </>
      )}
    </button>
  );
}

export default function ClientsTab() {
  const navigate = useNavigate();
  const { data: clients, isLoading, error } = useClients();

  if (isLoading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 0',
          color: 'var(--color-text-muted)',
          fontSize: 14,
          letterSpacing: '0.04em',
        }}
      >
        Loading clients...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 0',
          color: 'var(--color-error)',
          fontSize: 14,
        }}
      >
        Failed to load clients. Please try again.
      </div>
    );
  }

  return (
    <div>
      <div
        className="dashboard-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          marginTop: 20,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 300,
            color: 'var(--color-text-primary)',
          }}
        >
          Clients
        </h2>
        <div className="dashboard-header-buttons" style={{ display: 'flex', alignItems: 'center' }}>
          <ShareIntakeButton />
          <button
            className="btn btn-accent"
            onClick={() => navigate('/new-client')}
          >
            New Client
          </button>
        </div>
      </div>
      
      <ClientTable clients={clients} />
    </div>
  );
}

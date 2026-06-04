import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useClients, useFeedback, useInvoices, useReceipts } from '../hooks/useApi';
import { useUser } from '@clerk/react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: clients } = useClients();
  const { data: feedback } = useFeedback();
  const { data: invoices } = useInvoices();
  const { data: receipts } = useReceipts();

  // Compute stats
  const totalClients = clients?.length || 0;

  const thisMonth = clients
    ? clients.filter((c) => {
        const created = new Date(c.created_at);
        const now = new Date();
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length
    : 0;

  const feedbackCount = feedback?.length || 0;

  const avgRating = feedback && feedback.length > 0
    ? (
        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      ).toFixed(1)
    : '—';

  // Compute Financial stats (safely)
  const invoicesSent = invoices
    ? invoices.filter((i) => i.status === 'sent' || i.status === 'paid').length
    : 0;

  const paymentsReceived = receipts ? receipts.length : 0;

  const totalRevenue = receipts
    ? receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
    : 0;

  const thisMonthEarnings = receipts
    ? receipts
        .filter((r) => {
          const date = new Date(r.payment_date || r.created_at);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
    : 0;

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';
  const formattedRevenue = `${currency} ${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formattedMonthly = `${currency} ${thisMonthEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  // Show "New Client" button only on clients tab
  const isClientsTab = location.pathname === '/dashboard';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="dashboard-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        
        {/* Section: Performance */}
        <h3 style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginTop: 40,
          marginBottom: 8,
          fontFamily: 'var(--font-body)'
        }}>
          Studio Performance
        </h3>
        <div
          className="stat-card-container"
          style={{
            display: 'flex',
            gap: 16,
            paddingBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <StatCard value={totalClients} label="Total Clients" delay={50} />
          <StatCard value={thisMonth} label="New This Month" delay={100} />
          <StatCard value={avgRating} label="Avg Rating" delay={150} />
          <StatCard value={feedbackCount} label="Feedback Received" delay={200} />
        </div>

        {/* Section: Financials */}
        <h3 style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginTop: 16,
          marginBottom: 8,
          fontFamily: 'var(--font-body)'
        }}>
          Financial Insights
        </h3>
        <div
          className="stat-card-container"
          style={{
            display: 'flex',
            gap: 16,
            paddingBottom: 40,
            flexWrap: 'wrap',
          }}
        >
          <StatCard value={formattedRevenue} label="Total Revenue" delay={250} />
          <StatCard value={formattedMonthly} label="This Month Earnings" delay={300} />
          <StatCard value={invoicesSent} label="Invoices Sent" delay={350} />
          <StatCard value={paymentsReceived} label="Payments Received" delay={400} />
        </div>

        {/* Section header with action */}
        {isClientsTab && (
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
        )}

        {/* Tab Content */}
        <div style={{ paddingBottom: 80 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

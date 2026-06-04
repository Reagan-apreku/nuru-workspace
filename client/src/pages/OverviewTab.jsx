import { useClients, useFeedback, useInvoices, useReceipts } from '../hooks/useApi';
import { useUser } from '@clerk/react';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';

export default function OverviewTab() {
  const { user } = useUser();
  const navigate = useNavigate();

  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: feedback, isLoading: loadingFeedback } = useFeedback();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: receipts, isLoading: loadingReceipts } = useReceipts();

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

  const firstName = user?.firstName || 'Photographer';

  const isLoading = loadingClients || loadingFeedback || loadingInvoices || loadingReceipts;

  return (
    <div style={{ marginTop: 24 }} className="animate-fade-in">
      {/* Welcome Header */}
      <div style={{
        marginBottom: 36,
        padding: '32px 36px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 8,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Subtle decorative background gradient */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 300,
          marginBottom: 8,
          color: '#fff',
          letterSpacing: '0.02em'
        }}>
          Welcome back, <span style={{ color: '#c9a96e', fontWeight: 400 }}>{firstName}</span>
        </h2>
        <p style={{
          fontSize: 14,
          color: '#94a3b8',
          margin: 0,
          fontWeight: 300,
          lineHeight: 1.5
        }}>
          Here is an overview of your studio's performance, clients, and recent financial transactions.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{
            width: 32,
            height: 32,
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-text-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <>
          {/* Section: Performance */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 16,
              fontFamily: 'var(--font-body)'
            }}>
              Studio Performance
            </h3>
            <div
              className="stat-card-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <StatCard value={totalClients} label="Total Clients" delay={50} />
              <StatCard value={thisMonth} label="New This Month" delay={100} />
              <StatCard value={avgRating} label="Avg Rating" delay={150} />
              <StatCard value={feedbackCount} label="Feedback Received" delay={200} />
            </div>
          </div>

          {/* Section: Financials */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 16,
              fontFamily: 'var(--font-body)'
            }}>
              Financial Insights
            </h3>
            <div
              className="stat-card-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <StatCard value={formattedRevenue} label="Total Revenue" delay={250} />
              <StatCard value={formattedMonthly} label="This Month Earnings" delay={300} />
              <StatCard value={invoicesSent} label="Invoices Sent" delay={350} />
              <StatCard value={paymentsReceived} label="Payments Received" delay={400} />
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 16,
              fontFamily: 'var(--font-body)'
            }}>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16
            }}>
              <div 
                onClick={() => navigate('/new-client')}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
                className="hover-card-highlight"
              >
                <div style={{
                  background: 'rgba(201,169,110,0.1)',
                  color: '#c9a96e',
                  borderRadius: 6,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="17" y1="11" x2="23" y2="11" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Add New Client</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Register a client details manually</p>
                </div>
              </div>

              <div 
                onClick={() => navigate('/dashboard/invoices')}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
                className="hover-card-highlight"
              >
                <div style={{
                  background: 'rgba(30,41,59,0.06)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 6,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Create Invoice</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Bill client for services/products</p>
                </div>
              </div>

              <div 
                onClick={() => navigate('/dashboard/receipts')}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
                className="hover-card-highlight"
              >
                <div style={{
                  background: 'rgba(22,101,52,0.1)',
                  color: '#166534',
                  borderRadius: 6,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Issue Receipt</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Record payments and confirm receipts</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .hover-card-highlight:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          border-color: #c9a96e !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

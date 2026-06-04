import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useClients, useFeedback } from '../hooks/useApi';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: clients } = useClients();
  const { data: feedback } = useFeedback();

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

  // Show "New Client" button only on clients tab
  const isClientsTab = location.pathname === '/dashboard';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '40px 0',
            flexWrap: 'wrap',
          }}
        >
          <StatCard value={totalClients} label="Total Clients" delay={50} />
          <StatCard value={thisMonth} label="This Month" delay={100} />
          <StatCard value={avgRating} label="Avg Rating" delay={150} />
          <StatCard value={feedbackCount} label="Feedback Count" delay={200} />
        </div>

        {/* Section header with action */}
        {isClientsTab && (
          <div
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
            <button
              className="btn btn-accent"
              onClick={() => navigate('/new-client')}
            >
              New Client
            </button>
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

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="dashboard-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Tab Content */}
        <div style={{ paddingBottom: 80 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { useClients } from '../hooks/useApi';
import ClientTable from '../components/ClientTable';

export default function ClientsTab() {
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

  return <ClientTable clients={clients} />;
}

export default function StatCard({ value, label, delay = 0 }) {
  return (
    <div
      className="animate-fade-in stat-card"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 6,
        padding: '32px 28px',
        flex: 1,
        minWidth: 160,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48,
          fontWeight: 300,
          lineHeight: 1,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

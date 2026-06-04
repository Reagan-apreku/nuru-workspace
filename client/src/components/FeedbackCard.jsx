function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function FeedbackCard({ feedback, delay = 0 }) {
  const clientName = feedback.clients
    ? `${feedback.clients.first_name} ${feedback.clients.last_name}`
    : 'Unknown Client';

  const shootType = feedback.clients?.shoot_type || '';

  return (
    <div
      className="animate-fade-in-up"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 8,
        padding: '32px',
        maxWidth: 560,
        margin: '0 auto 20px',
        opacity: 0,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              marginBottom: 4,
            }}
          >
            {clientName}
          </div>
          {shootType && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-faint)',
              }}
            >
              {shootType}
            </div>
          )}
        </div>

        {/* Star rating */}
        <div
          style={{
            color: 'var(--color-accent-gold)',
            fontSize: 18,
            letterSpacing: 3,
          }}
        >
          {'★'.repeat(feedback.rating)}
          {'☆'.repeat(5 - feedback.rating)}
        </div>
      </div>

      {/* Comment */}
      {feedback.comment && (
        <p
          style={{
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            fontSize: 15,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          "{feedback.comment}"
        </p>
      )}

      {/* Date */}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--color-text-faint)',
        }}
      >
        {formatDate(feedback.created_at)}
      </div>
    </div>
  );
}

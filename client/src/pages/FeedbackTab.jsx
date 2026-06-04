import { useFeedback } from '../hooks/useApi';
import FeedbackCard from '../components/FeedbackCard';

export default function FeedbackTab() {
  const { data: feedback, isLoading, error } = useFeedback();

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
        Loading feedback...
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
        Failed to load feedback. Please try again.
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
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
        No feedback yet.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 300,
          color: 'var(--color-text-primary)',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        Client Feedback
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 24,
        }}
      >
        {feedback.map((item, idx) => (
          <FeedbackCard key={item.id} feedback={item} delay={idx * 60} />
        ))}
      </div>
    </div>
  );
}

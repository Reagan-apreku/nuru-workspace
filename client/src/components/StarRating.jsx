export default function StarRating({ rating, onRate, size = 40 }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            fontSize: size,
            lineHeight: 1,
            color: star <= rating ? 'var(--color-accent-gold)' : 'var(--color-border)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = star <= rating ? 'scale(1.1)' : 'scale(1)';
          }}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

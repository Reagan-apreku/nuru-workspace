import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClientForm } from '../hooks/useClientForm';
import { useCreateClient, useSubmitFeedback } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import StarRating from '../components/StarRating';

export default function ClientForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('source') === 'shared';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { studioName } = useStudioProfile();

  const {
    formData,
    rating,
    comment,
    errors,
    setErrors,
    setRating,
    setComment,
    updateField,
    validate,
    SHOOT_TYPES,
  } = useClientForm();

  const createClient = useCreateClient();
  const submitFeedback = useSubmitFeedback();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Create the client
      const newClient = await createClient.mutateAsync({
        ...formData,
      });

      // Submit feedback if rating was provided
      if (rating > 0) {
        await submitFeedback.mutateAsync({
          client_id: newClient.id,
          rating,
          comment: comment.trim() || null,
        });
      }

      // Navigate to success page
      navigate(`/success${window.location.search}`);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 480,
          opacity: 0,
        }}
      >
        {/* Back to Dashboard */}
        {!isShared && (
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0 0 32px',
              transition: 'color 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </button>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 56,
              fontWeight: 300,
              color: 'var(--color-text-primary)',
              marginBottom: 12,
              letterSpacing: '0.02em',
            }}
          >
            Welcome
          </h1>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-gold)',
              marginBottom: 8,
            }}
          >
            {studioName}
          </p>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-muted)',
              fontWeight: 300,
            }}
          >
            Please take a moment to fill in your details.
          </p>
        </div>

        {/* Error Banner */}
        {errors.general && (
          <div
            style={{
              color: 'var(--color-error)',
              fontSize: 14,
              marginBottom: 24,
              padding: '12px 16px',
              backgroundColor: '#fef2f1',
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <label className="field-label">First Name</label>
              <input
                type="text"
                className={`input-field ${errors.first_name ? 'error' : ''}`}
                value={formData.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="First name"
              />
              {errors.first_name && <div className="field-error">{errors.first_name}</div>}
            </div>
            <div>
              <label className="field-label">Last Name</label>
              <input
                type="text"
                className={`input-field ${errors.last_name ? 'error' : ''}`}
                value={formData.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Last name"
              />
              {errors.last_name && <div className="field-error">{errors.last_name}</div>}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Email</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Phone</label>
            <input
              type="tel"
              className="input-field"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(optional)"
            />
          </div>

          {/* Shoot Type */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Shoot Type</label>
            <select
              className={`select-field ${errors.shoot_type ? 'error' : ''}`}
              value={formData.shoot_type}
              onChange={(e) => updateField('shoot_type', e.target.value)}
            >
              <option value="">Select type...</option>
              {SHOOT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.shoot_type && <div className="field-error">{errors.shoot_type}</div>}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 48 }}>
            <label className="field-label">Notes (Optional)</label>
            <textarea
              className="textarea-field"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any special requests or details..."
              style={{ minHeight: 100 }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: 'var(--color-border)',
              margin: '0 0 48px',
            }}
          />

          {/* Rate Your Visit */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 300,
                color: 'var(--color-text-primary)',
                marginBottom: 8,
              }}
            >
              Rate Your Visit
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginBottom: 24,
              }}
            >
              How was your experience?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StarRating rating={rating} onRate={setRating} size={40} />
            </div>
          </div>

          {/* Comment */}
          {rating > 0 && (
            <div
              className="animate-fade-in"
              style={{ marginBottom: 40, opacity: 0 }}
            >
              <textarea
                className="textarea-field"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts (optional)..."
                style={{ minHeight: 100 }}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
            style={{ height: 52, fontSize: 14 }}
          >
            {isSubmitting ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useUser } from '@clerk/react';
import { useSendEmail, useClients, useSentEmails } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function replacePlaceholders(templateStr, variables = {}) {
  if (!templateStr) return '';
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

export default function EmailForm() {
  const [recipientType, setRecipientType] = useState('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const { data: clients } = useClients();
  const { data: sentEmails } = useSentEmails();
  const sendEmail = useSendEmail();
  const { user } = useUser();
  const profile = useStudioProfile();

  const photographerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const vars = {
    client_name: 'Sarah',
    client_last_name: 'Smith',
    client_full_name: 'Sarah Smith',
    studio_name: profile.studioName || 'Nuru Workspace',
    studio_tagline: profile.tagline || '',
    studio_location: profile.location || '',
    studio_website: profile.website || '',
    photographer_name: photographerName || '',
  };

  function validate() {
    const newErrors = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!body.trim()) newErrors.body = 'Email body is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSend(e) {
    e.preventDefault();
    setSuccessMsg('');

    if (!validate()) return;

    try {
      const result = await sendEmail.mutateAsync({
        subject: subject.trim(),
        body: body.trim(),
        recipient_type: recipientType,
        studio_name: profile.studioName,
        email_header: profile.emailHeader,
        email_footer: profile.emailFooter,
        email_greeting: profile.emailGreeting,
        brand_color: profile.brandColor,
        photographer_name: photographerName,
        studio_tagline: profile.tagline,
        studio_location: profile.location,
        studio_website: profile.website,
      });

      setSuccessMsg(result.message || 'Email sent successfully');
      setSubject('');
      setBody('');
      setRecipientType('all');
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: err.response?.data?.error || 'Failed to send email' });
      }
    }
  }

  // Get unique client emails for the dropdown
  const clientEmails = clients
    ? [...new Set(clients.map((c) => c.email))].sort()
    : [];

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', 
          gap: 40, 
          alignItems: 'start'
        }}
      >
        {/* Compose Form */}
        <form onSubmit={handleSend}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 300,
              marginBottom: 40,
              color: 'var(--color-text-primary)',
            }}
          >
            Compose
          </h2>

          {errors.general && (
            <div
              style={{
                color: 'var(--color-error)',
                fontSize: 14,
                marginBottom: 20,
                padding: '12px 16px',
                backgroundColor: '#fef2f1',
                borderRadius: 4,
              }}
            >
              {errors.general}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                color: 'var(--color-success)',
                fontSize: 14,
                marginBottom: 20,
                padding: '12px 16px',
                backgroundColor: '#f0f7f2',
                borderRadius: 4,
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Recipient */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Recipient</label>
            <select
              className={`select-field ${errors.recipient_type ? 'error' : ''}`}
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clientEmails.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Subject</label>
            <input
              type="text"
              className={`input-field ${errors.subject ? 'error' : ''}`}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
              placeholder="Email subject"
            />
            {errors.subject && <div className="field-error">{errors.subject}</div>}
          </div>

          {/* Body */}
          <div style={{ marginBottom: 32 }}>
            <label className="field-label">Body</label>
            <textarea
              className={`textarea-field ${errors.body ? 'error' : ''}`}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
              }}
              placeholder="Write your email..."
              style={{ minHeight: 160 }}
            />
            {errors.body && <div className="field-error">{errors.body}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={sendEmail.isPending}
          >
            {sendEmail.isPending ? 'Sending...' : 'Send Email'}
          </button>
        </form>

        {/* Live Preview Panel */}
        <div 
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 24,
            backgroundColor: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            fontSize: 14,
            color: '#333',
            marginTop: 78
          }}
        >
          <div 
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 16,
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: 8,
            }}
          >
            Live Email Preview
          </div>
          <div 
            style={{
              fontSize: 18,
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: profile.brandColor || '#1a1a1a',
              borderBottom: `1px solid ${(profile.brandColor || '#1a1a1a')}22`,
              paddingBottom: 12,
              marginBottom: 20,
            }}
          >
            {replacePlaceholders(profile.emailHeader || profile.studioName || "NURU WORKSPACE", vars)}
          </div>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>
            Subject: <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{replacePlaceholders(subject || "Email Subject Line", vars)}</span>
          </div>
          <div style={{ fontStyle: 'normal', color: '#666', marginBottom: 16 }}>
            {replacePlaceholders(profile.emailGreeting || 'Hello {{client_name}},', vars)}
          </div>
          <div style={{ color: '#555', lineHeight: 1.6, fontSize: 13, marginBottom: 24, minHeight: 48, whiteSpace: 'pre-wrap' }}>
            {replacePlaceholders(body || "Your actual email content goes here...", vars)}
          </div>
          <div 
            style={{
              borderTop: '1px solid #e8e5e0',
              paddingTop: 16,
              fontSize: 11,
              color: '#999',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {replacePlaceholders(profile.emailFooter || 'You received this email because you are a client of {{studio_name}}.\nIf you believe this was sent in error, please disregard.', vars)}
          </div>
        </div>
      </div>

      {/* Sent Emails History */}
      {sentEmails && sentEmails.length > 0 && (
        <div style={{ marginTop: 80 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 300,
              marginBottom: 32,
              color: 'var(--color-text-primary)',
            }}
          >
            Sent History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sentEmails.map((email, idx) => (
              <div
                key={email.id}
                className="animate-fade-in"
                style={{
                  padding: '20px 0',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: 0,
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: 'var(--color-text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {email.subject}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 12,
                    color: 'var(--color-text-faint)',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>
                    To: {email.recipient_type === 'all' ? 'All Clients' : email.recipient_type}
                  </span>
                  <span>{formatDate(email.sent_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

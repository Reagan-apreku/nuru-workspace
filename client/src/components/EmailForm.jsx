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

const EMAIL_TEMPLATES = [
  {
    id: 'none',
    name: '— Start from scratch —',
    subject: '',
    body: '',
  },
  {
    id: 'intake_request',
    name: 'Client Intake Form Request',
    subject: 'Preparing for your shoot with {{studio_name}}',
    body: 'Hi {{client_name}},\n\nWe are thrilled to work with you on your upcoming session!\n\nTo help us capture your vision perfectly, please fill out our client details form here:\n{{studio_website}}/new-client\n\nIt takes less than 2 minutes and helps us prepare all necessary equipment and concepts.\n\nLooking forward to creating magic together!',
  },
  {
    id: 'session_reminder',
    name: 'Session Confirmation & Details',
    subject: 'Your upcoming session with {{studio_name}}',
    body: 'Hi {{client_name}},\n\nThis is a quick reminder about your scheduled photo session with {{studio_name}}.\n\nWe will be meeting at our standard location:\n{{studio_location}}\n\nIf you have any questions about outfits, timing, or concepts, please reply to this email directly.\n\nSee you soon!',
  },
  {
    id: 'feedback_request',
    name: 'Thank You & Feedback Request',
    subject: 'We loved working with you! How did we do?',
    body: 'Hi {{client_name}},\n\nThank you for choosing {{studio_name}} for your recent shoot!\n\nWe loved working with you, and we hope you love the photos. We are always striving to improve our services.\n\nCould you please take a moment to leave us a quick review?\n{{studio_website}}/new-client (You can rate us at the bottom of the form)\n\nWe appreciate your support and hope to work with you again soon!',
  },
];

export default function EmailForm() {
  const [recipientType, setRecipientType] = useState('all');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [singleEmail, setSingleEmail] = useState('');
  const [clientSearch, setClientSearch] = useState('');
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
    
    if (recipientType === 'custom' && selectedEmails.length === 0) {
      newErrors.recipient_type = 'Please select at least one client';
    } else if (recipientType === 'single') {
      if (!singleEmail.trim()) {
        newErrors.single_email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleEmail)) {
        newErrors.single_email = 'Invalid email address';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSend(e) {
    e.preventDefault();
    setSuccessMsg('');

    if (!validate()) return;

    try {
      const payload = {
        subject: subject.trim(),
        body: body.trim(),
        recipient_type: recipientType === 'single' ? singleEmail.trim() : recipientType,
        studio_name: profile.studioName,
        email_header: profile.emailHeader,
        email_footer: profile.emailFooter,
        email_greeting: profile.emailGreeting,
        brand_color: profile.brandColor,
        photographer_name: photographerName,
        studio_tagline: profile.tagline,
        studio_location: profile.location,
        studio_website: profile.website,
      };

      if (recipientType === 'custom') {
        payload.recipient_emails = selectedEmails;
      }

      const result = await sendEmail.mutateAsync(payload);

      setSuccessMsg(result.message || 'Email sent successfully');
      setSubject('');
      setBody('');
      setRecipientType('all');
      setSelectedEmails([]);
      setSingleEmail('');
      setClientSearch('');
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: err.response?.data?.error || 'Failed to send email' });
      }
    }
  }

  // Get unique client emails for the dropdown datalist
  const clientEmails = clients
    ? [...new Set(clients.map((c) => c.email))].sort()
    : [];

  // Filter clients based on selection search input
  const filteredClientsForSelection = clients
    ? clients.filter((c) => {
        const query = clientSearch.toLowerCase();
        return (
          c.first_name?.toLowerCase().includes(query) ||
          c.last_name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.shoot_type?.toLowerCase().includes(query)
        );
      })
    : [];

  // Handle toggling select/deselect of client emails
  const toggleEmailSelection = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
    if (errors.recipient_type) {
      setErrors((prev) => ({ ...prev, recipient_type: undefined }));
    }
  };

  const selectAllClients = () => {
    if (clients) {
      const allEmails = [...new Set(clients.map((c) => c.email))].filter(Boolean);
      setSelectedEmails(allEmails);
    }
  };

  const clearAllClients = () => {
    setSelectedEmails([]);
  };

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

          {/* Recipient Group Selection */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Recipient Group</label>
            <select
              className={`select-field ${errors.recipient_type ? 'error' : ''}`}
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value);
                if (errors.recipient_type) setErrors((prev) => ({ ...prev, recipient_type: undefined }));
              }}
            >
              <option value="all">All Clients</option>
              <optgroup label="By Shoot Type">
                <option value="shoot:Portrait">Portrait Clients</option>
                <option value="shoot:Wedding">Wedding Clients</option>
                <option value="shoot:Corporate/Headshot">Corporate / Headshot Clients</option>
                <option value="shoot:Product/Commercial">Product / Commercial Clients</option>
                <option value="shoot:Family">Family Clients</option>
                <option value="shoot:Maternity">Maternity Clients</option>
                <option value="shoot:Events">Event Clients</option>
                <option value="shoot:Other">Other Shoot Clients</option>
              </optgroup>
              <optgroup label="Custom Targeted Selections">
                <option value="custom">Select Specific Clients (Multi-Select)</option>
                <option value="single">Single Client Email</option>
              </optgroup>
            </select>
            {errors.recipient_type && <div className="field-error">{errors.recipient_type}</div>}
          </div>

          {/* Render Multi-Select Box when custom is selected */}
          {recipientType === 'custom' && (
            <div 
              className="animate-fade-in"
              style={{ 
                marginBottom: 24, 
                padding: 16, 
                border: '1px solid var(--color-border)', 
                borderRadius: 6,
                backgroundColor: 'var(--color-bg-surface)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Select Clients ({selectedEmails.length} selected)
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    type="button" 
                    onClick={selectAllClients}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    onClick={clearAllClients}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Search Clients Box */}
              <input
                type="text"
                className="input-field"
                placeholder="Search clients by name, email, or shoot type..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                style={{ height: 36, fontSize: 13, marginBottom: 10, padding: '0 12px' }}
              />

              {/* Scrollable list of clients */}
              <div 
                style={{ 
                  maxHeight: 180, 
                  overflowY: 'auto', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 4, 
                  backgroundColor: '#fff',
                  padding: '8px 12px' 
                }}
              >
                {filteredClientsForSelection.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '12px 0', textAlign: 'center' }}>
                    No clients found
                  </div>
                ) : (
                  filteredClientsForSelection.map((client) => {
                    const isSelected = selectedEmails.includes(client.email);
                    return (
                      <label 
                        key={client.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '6px 0', 
                          cursor: 'pointer',
                          fontSize: 13,
                          borderBottom: '1px solid #f9f9f9',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEmailSelection(client.email)}
                          style={{ marginRight: 10, cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span style={{ color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                            {client.first_name} {client.last_name} <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>({client.email})</span>
                          </span>
                          <span 
                            style={{ 
                              fontSize: 10, 
                              fontWeight: 600, 
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase',
                              color: 'var(--color-text-faint)',
                              backgroundColor: 'var(--color-bg-surface)',
                              padding: '2px 6px',
                              borderRadius: 3
                            }}
                          >
                            {client.shoot_type}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Render Autocomplete Single Email Input when single is selected */}
          {recipientType === 'single' && (
            <div style={{ marginBottom: 24 }} className="animate-fade-in">
              <label className="field-label">Single Client Email</label>
              <input
                type="email"
                list="client-emails-list"
                className={`input-field ${errors.single_email ? 'error' : ''}`}
                placeholder="Enter or select email address"
                value={singleEmail}
                onChange={(e) => {
                  setSingleEmail(e.target.value);
                  if (errors.single_email) setErrors((prev) => ({ ...prev, single_email: undefined }));
                }}
              />
              <datalist id="client-emails-list">
                {clientEmails.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
              {errors.single_email && <div className="field-error">{errors.single_email}</div>}
            </div>
          )}

          {/* Email Template */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Email Template</label>
            <select
              className="select-field"
              defaultValue="none"
              onChange={(e) => {
                const template = EMAIL_TEMPLATES.find((t) => t.id === e.target.value);
                if (template) {
                  setSubject(template.subject);
                  setBody(template.body);
                  setErrors((prev) => ({
                    ...prev,
                    subject: template.subject ? undefined : prev.subject,
                    body: template.body ? undefined : prev.body,
                  }));
                }
              }}
            >
              {EMAIL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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

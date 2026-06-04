import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserProfile } from '@clerk/react';
import Navbar from '../components/Navbar';

const SHOOT_TYPES = [
  'Portrait',
  'Wedding',
  'Corporate/Headshot',
  'Product/Commercial',
  'Family',
  'Maternity',
  'Events',
  'Fashion',
  'Real Estate',
  'Food & Lifestyle',
];

function replacePlaceholders(templateStr, variables = {}) {
  if (!templateStr) return '';
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('studio');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [usdToGhsRate, setUsdToGhsRate] = useState(10.0);

  useEffect(() => {
    const loadRate = async () => {
      const envRate = import.meta.env.VITE_PAYSTACK_USD_TO_GHS_RATE;
      if (envRate) {
        const parsed = parseFloat(envRate);
        if (!isNaN(parsed) && parsed > 0) {
          setUsdToGhsRate(parsed);
          return;
        }
      }
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.GHS) {
          setUsdToGhsRate(data.rates.GHS);
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate:', e);
      }
    };
    loadRate();
  }, []);

  const handlePaystackPayment = (planKey) => {
    try {
      if (!window.PaystackPop) {
        alert('Paystack SDK failed to load. Please check your internet connection.');
        return;
      }

      const priceUSD = planKey === 'lifetime' ? 100 : 19;
      const priceGHS = Math.round(priceUSD * usdToGhsRate);
      console.log(`Converting $${priceUSD} USD to GHS at rate: ${usdToGhsRate} = GHS ${priceGHS}`);

      const email = user?.primaryEmailAddress?.emailAddress || '';
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_a6978513a7d8178d623bf0ef2b75dd28cc98efb2',
        email: email,
        amount: priceGHS * 100, // in cents/kobo
        currency: 'GHS',
        metadata: {
          userId: user?.id || '',
          planKey: planKey,
          custom_fields: [
            { display_name: "Plan Key", variable_name: "plan_key", value: planKey },
            { display_name: "User ID", variable_name: "user_id", value: user?.id || '' }
          ]
        },
        callback: function(response) {
          user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              plan: planKey,
              planStartDate: new Date().toISOString(),
              paymentReference: response?.reference,
            }
          }).then(() => {
            alert('Congratulations! You have successfully upgraded to the Lifetime Pass.');
            window.location.reload();
          }).catch((err) => {
            console.error('Failed to update plan:', err);
            alert('Upgrade succeeded but profile update failed. Contact support with reference: ' + response?.reference);
          });
        },
        onClose: () => {
          alert('Upgrade transaction cancelled.');
        }
      });
      handler.openIframe();
    } catch (err) {
      console.error('Error starting Paystack payment:', err);
      alert('Error starting payment: ' + err.message);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel your Professional Subscription? Your features will remain active until the end of your current 30-day billing period."
    );
    if (!confirmCancel) return;

    try {
      setSaving(true);
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          cancelAtPeriodEnd: true,
        }
      });
      alert("Your subscription has been set to cancel at the end of the billing period.");
      window.location.reload();
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      alert("Failed to cancel subscription: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setSaving(true);
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          cancelAtPeriodEnd: false,
        }
      });
      alert("Your subscription has been successfully re-activated!");
      window.location.reload();
    } catch (err) {
      console.error("Failed to re-activate subscription:", err);
      alert("Failed to re-activate subscription: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getExpiryDateStr = () => {
    if (!user) return '';
    const meta = user.unsafeMetadata || {};
    const startDate = meta.planStartDate ? new Date(meta.planStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    return endDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [studioData, setStudioData] = useState({
    studioName: '',
    location: '',
    website: '',
    tagline: '',
    shootTypes: [],
    sessionReminders: true,
    autoThankYou: true,
    emailHeader: '',
    emailFooter: '',
    emailGreeting: '',
    brandColor: '',
  });

  const photographerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const vars = {
    client_name: 'Sarah',
    client_last_name: 'Smith',
    client_full_name: 'Sarah Smith',
    studio_name: studioData.studioName || 'Nuru Workspace',
    studio_tagline: studioData.tagline || '',
    studio_location: studioData.location || '',
    studio_website: studioData.website || '',
    photographer_name: photographerName || '',
  };

  // Load existing data from Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      const meta = user.unsafeMetadata || {};
      setStudioData({
        studioName: meta.studioName || '',
        location: meta.location || '',
        website: meta.website || '',
        tagline: meta.tagline || '',
        shootTypes: meta.shootTypes || [],
        sessionReminders: meta.sessionReminders !== false,
        autoThankYou: meta.autoThankYou !== false,
        emailHeader: meta.emailHeader || '',
        emailFooter: meta.emailFooter || '',
        emailGreeting: meta.emailGreeting || '',
        brandColor: meta.brandColor || '',
      });
    }
  }, [isLoaded, user]);

  function toggleShootType(type) {
    setStudioData((prev) => ({
      ...prev,
      shootTypes: prev.shootTypes.includes(type)
        ? prev.shootTypes.filter((t) => t !== type)
        : [...prev.shootTypes, type],
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
          studioName: studioData.studioName,
          location: studioData.location,
          website: studioData.website,
          tagline: studioData.tagline,
          shootTypes: studioData.shootTypes,
          sessionReminders: studioData.sessionReminders,
          autoThankYou: studioData.autoThankYou,
          emailHeader: studioData.emailHeader,
          emailFooter: studioData.emailFooter,
          emailGreeting: studioData.emailGreeting,
          brandColor: studioData.brandColor,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) return null;

  const TABS = [
    { key: 'studio', label: 'Studio' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'account', label: 'Account & Security' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        {/* Page Header */}
        <div style={{ padding: '48px 0 0' }}>
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
              padding: 0,
              marginBottom: 32,
              transition: 'color 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--color-text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--color-text-muted)')
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </button>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 44,
              fontWeight: 300,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            Profile
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-muted)',
              fontWeight: 300,
              marginBottom: 40,
            }}
          >
            Manage your studio brand and account settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 48,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color:
                  activeTab === tab.key
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                borderBottom:
                  activeTab === tab.key
                    ? '2px solid var(--color-accent-gold)'
                    : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Studio Tab */}
        {activeTab === 'studio' && (
          <div
            className="animate-fade-in"
            style={{ opacity: 0, paddingBottom: 80 }}
          >
            {/* Studio Identity */}
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 300,
                  color: 'var(--color-text-primary)',
                  marginBottom: 8,
                }}
              >
                Studio Identity
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-faint)',
                  fontWeight: 300,
                  marginBottom: 32,
                }}
              >
                Your brand details appear in emails and client-facing screens.
              </p>

              <div style={{ marginBottom: 24 }}>
                <label className="field-label">Studio Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Nuru Studios"
                  value={studioData.studioName}
                  onChange={(e) =>
                    setStudioData((p) => ({ ...p, studioName: e.target.value }))
                  }
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="field-label">Tagline</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Capturing light, preserving moments"
                  value={studioData.tagline}
                  onChange={(e) =>
                    setStudioData((p) => ({ ...p, tagline: e.target.value }))
                  }
                />
              </div>

              <div
                className="grid-responsive-2col"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <label className="field-label">Location</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Accra, Ghana"
                    value={studioData.location}
                    onChange={(e) =>
                      setStudioData((p) => ({
                        ...p,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Website</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://yourstudio.com"
                    value={studioData.website}
                    onChange={(e) =>
                      setStudioData((p) => ({
                        ...p,
                        website: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--color-border)',
                margin: '0 0 48px',
              }}
            />

            {/* Shoot Types */}
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 300,
                  color: 'var(--color-text-primary)',
                  marginBottom: 8,
                }}
              >
                Shoot Types
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-faint)',
                  fontWeight: 300,
                  marginBottom: 24,
                }}
              >
                Select the types of sessions you offer.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {SHOOT_TYPES.map((type) => {
                  const selected = studioData.shootTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleShootType(type)}
                      style={{
                        padding: '10px 20px',
                        fontSize: 13,
                        fontWeight: 400,
                        border: '1px solid',
                        borderColor: selected
                          ? 'var(--color-accent-gold)'
                          : 'var(--color-border)',
                        backgroundColor: selected
                          ? 'var(--color-accent-gold)'
                          : 'transparent',
                        color: selected ? '#fff' : 'var(--color-text-muted)',
                        borderRadius: 24,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Divider */}
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--color-border)',
                margin: '0 0 48px',
              }}
            />

            {/* Communication Preferences */}
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 300,
                  color: 'var(--color-text-primary)',
                  marginBottom: 8,
                }}
              >
                Communication
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-faint)',
                  fontWeight: 300,
                  marginBottom: 24,
                }}
              >
                Automated email preferences for your clients.
              </p>

              {/* Toggle: Session Reminders */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 400,
                      color: 'var(--color-text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    Session Reminders
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-faint)',
                      fontWeight: 300,
                    }}
                  >
                    Email clients before upcoming sessions
                  </div>
                </div>
                <button
                  onClick={() =>
                    setStudioData((p) => ({
                      ...p,
                      sessionReminders: !p.sessionReminders,
                    }))
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    backgroundColor: studioData.sessionReminders
                      ? 'var(--color-accent-gold)'
                      : 'var(--color-border)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: studioData.sessionReminders ? 23 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  />
                </button>
              </div>

              {/* Toggle: Auto Thank-You */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 0',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 400,
                      color: 'var(--color-text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    Auto Thank-You Emails
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-faint)',
                      fontWeight: 300,
                    }}
                  >
                    Send a follow-up after each session
                  </div>
                </div>
                <button
                  onClick={() =>
                    setStudioData((p) => ({
                      ...p,
                      autoThankYou: !p.autoThankYou,
                    }))
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    backgroundColor: studioData.autoThankYou
                      ? 'var(--color-accent-gold)'
                      : 'var(--color-border)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: studioData.autoThankYou ? 23 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  />
                </button>
              </div>
            </section>

            {/* Divider */}
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--color-border)',
                margin: '0 0 48px',
              }}
            />

            {/* Email Template Section */}
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 300,
                  color: 'var(--color-text-primary)',
                  marginBottom: 8,
                }}
              >
                Email Template
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-faint)',
                  fontWeight: 300,
                  marginBottom: 32,
                }}
              >
                Design the layout and default copy for all emails sent from your workspace.
              </p>

              <div 
                className="grid-responsive-split"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', 
                  gap: 40, 
                  alignItems: 'start' 
                }}
              >
                {/* Form Fields */}
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label">Email Header (Branding Title)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={studioData.studioName || "Nuru Workspace"}
                      value={studioData.emailHeader}
                      onChange={(e) =>
                        setStudioData((p) => ({ ...p, emailHeader: e.target.value }))
                      }
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label">Default Greeting</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Hello {{client_name}},"
                      value={studioData.emailGreeting}
                      onChange={(e) =>
                        setStudioData((p) => ({ ...p, emailGreeting: e.target.value }))
                      }
                    />
                    <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 6 }}>
                      Use <code>{"{{client_name}}"}</code> to insert the client's first name automatically.
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label">Email Footer / Signature</label>
                    <textarea
                      className="textarea-field"
                      placeholder={`Warm regards,\n${studioData.studioName || "Nuru Workspace"}`}
                      value={studioData.emailFooter}
                      onChange={(e) =>
                        setStudioData((p) => ({ ...p, emailFooter: e.target.value }))
                      }
                      style={{ minHeight: 100 }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label">Brand Accent Color</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={studioData.brandColor || '#1a1a1a'}
                        onChange={(e) =>
                          setStudioData((p) => ({ ...p, brandColor: e.target.value }))
                        }
                        style={{
                          border: 'none',
                          width: 44,
                          height: 44,
                          padding: 0,
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                        }}
                      />
                      <input
                        type="text"
                        className="input-field"
                        value={studioData.brandColor}
                        placeholder="#1a1a1a"
                        onChange={(e) =>
                          setStudioData((p) => ({ ...p, brandColor: e.target.value }))
                        }
                        style={{ flex: 1, fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>

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
                      color: studioData.brandColor || '#1a1a1a',
                      borderBottom: `1px solid ${(studioData.brandColor || '#1a1a1a')}22`,
                      paddingBottom: 12,
                      marginBottom: 20,
                    }}
                  >
                    {replacePlaceholders(studioData.emailHeader || studioData.studioName || "NURU WORKSPACE", vars)}
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 12 }}>
                    Subject: <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>Email Subject Line</span>
                  </div>
                  <div style={{ fontStyle: 'normal', color: '#666', marginBottom: 16 }}>
                    {replacePlaceholders(studioData.emailGreeting || 'Hello {{client_name}},', vars)}
                  </div>
                  <div style={{ color: '#555', lineHeight: 1.6, fontSize: 13, marginBottom: 24, minHeight: 48, whiteSpace: 'pre-wrap' }}>
                    Your actual email content goes here...
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
                    {replacePlaceholders(studioData.emailFooter || 'You received this email because you are a client of {{studio_name}}.\nIf you believe this was sent in error, please disregard.', vars)}
                  </div>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--color-border)',
                margin: '0 0 48px',
              }}
            />

            {/* Save Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                paddingTop: 8,
              }}
            >
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ height: 48, padding: '0 40px', fontSize: 13 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {saved && (
                <span
                  className="animate-fade-in"
                  style={{
                    fontSize: 13,
                    color: 'var(--color-accent-gold)',
                    fontWeight: 400,
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Changes saved
                </span>
              )}
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div
            className="animate-fade-in"
            style={{ opacity: 0, paddingBottom: 80 }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 300,
                color: 'var(--color-text-primary)',
                marginBottom: 8,
              }}
            >
              Subscription & Plans
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-text-faint)',
                fontWeight: 300,
                marginBottom: 32,
              }}
            >
              Manage your subscription, view billing history, or upgrade your account.
            </p>

            {/* Current plan card */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '24px 28px',
                backgroundColor: 'var(--color-bg-secondary)',
                marginBottom: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent-gold)',
                    display: 'block',
                    marginBottom: 4
                  }}
                >
                  CURRENT ACTIVE PLAN
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 300,
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'capitalize'
                  }}
                >
                  {user?.unsafeMetadata?.plan === 'lifetime'
                    ? 'Lifetime Pass'
                    : user?.unsafeMetadata?.plan === 'pro'
                    ? user?.unsafeMetadata?.cancelAtPeriodEnd
                      ? 'Professional Monthly (Cancelled)'
                      : 'Professional Monthly'
                    : 'Free Trial'}
                </span>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0 0', fontWeight: 300 }}>
                  {user?.unsafeMetadata?.plan === 'lifetime'
                    ? 'You have unlimited lifetime access. No further payments will be charged.'
                    : user?.unsafeMetadata?.plan === 'pro'
                    ? user?.unsafeMetadata?.cancelAtPeriodEnd
                      ? `Your subscription has been cancelled. Access will remain active until ${getExpiryDateStr()}.`
                      : 'Billed at $19/month. You can upgrade to Lifetime below.'
                    : 'Your 30-day free trial is currently active.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                    fontWeight: 500,
                    color: user?.unsafeMetadata?.cancelAtPeriodEnd ? '#ff9900' : 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {user?.unsafeMetadata?.plan === 'lifetime'
                    ? 'Active (Forever)'
                    : user?.unsafeMetadata?.cancelAtPeriodEnd
                    ? 'Active (Pending Cancellation)'
                    : 'Active'}
                </div>

                {user?.unsafeMetadata?.plan === 'pro' && (
                  user?.unsafeMetadata?.cancelAtPeriodEnd ? (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={saving}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent-gold)',
                        fontSize: 13,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      {saving ? 'Re-activating...' : 'Re-activate Subscription'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={saving}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff4444',
                        fontSize: 13,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      {saving ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Available Upgrades section */}
            {user?.unsafeMetadata?.plan !== 'lifetime' && (
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 300,
                    color: 'var(--color-text-primary)',
                    marginBottom: 20,
                  }}
                >
                  Available Upgrades
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  {/* Show Monthly Plan if they are on trial */}
                  {(user?.unsafeMetadata?.plan || 'trial') === 'trial' && (
                    <div
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        padding: '32px 28px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        flex: '1 1 300px',
                        maxWidth: 360,
                        boxSizing: 'border-box'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--color-text-muted)',
                          marginBottom: 12
                        }}
                      >
                        PROFESSIONAL PLAN
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                        <span style={{ fontSize: 44, fontWeight: 300, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>$19</span>
                        <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 300 }}>/month</span>
                      </div>

                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-muted)', fontWeight: 300, marginBottom: 24 }}>
                        Access all professional management features, billing, intake forms, and automated reminders.
                      </p>

                      <button
                        className="btn btn-secondary"
                        onClick={() => handlePaystackPayment('pro')}
                        style={{ height: 48, fontSize: 13, width: '100%' }}
                      >
                        Subscribe Monthly
                      </button>
                    </div>
                  )}

                  {/* Lifetime Plan Card */}
                  <div
                    style={{
                      border: '2px solid var(--color-accent-gold)',
                      borderRadius: 12,
                      padding: '32px 28px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      flex: '1 1 300px',
                      maxWidth: 360,
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        right: 24,
                        backgroundColor: 'var(--color-accent-gold)',
                        color: '#000',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.05em'
                      }}
                    >
                      BEST VALUE
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent-gold)',
                        marginBottom: 12
                      }}
                    >
                      LIFETIME PASS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                      <span style={{ fontSize: 44, fontWeight: 300, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>$100</span>
                      <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 300 }}>one-time</span>
                    </div>

                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-muted)', fontWeight: 300, marginBottom: 24 }}>
                      One payment, lifetime access. Never pay a monthly subscription. Includes all future upgrades.
                    </p>

                    <button
                      className="btn btn-primary"
                      onClick={() => handlePaystackPayment('lifetime')}
                      style={{ height: 48, fontSize: 13, width: '100%' }}
                    >
                      Upgrade to Lifetime
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account & Security Tab */}
        {activeTab === 'account' && (
          <div
            className="animate-fade-in"
            style={{ opacity: 0, paddingBottom: 80 }}
          >
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-text-faint)',
                fontWeight: 300,
                marginBottom: 32,
              }}
            >
              Manage your email, password, connected accounts, and security
              settings.
            </p>

            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: {
                      width: '100%',
                      boxShadow: 'none',
                    },
                    cardBox: {
                      boxShadow: 'none',
                      border: 'none',
                      width: '100%',
                    },
                    navbar: {
                      display: 'none',
                    },
                    navbarMobileMenuButton: {
                      display: 'none',
                    },
                    pageScrollBox: {
                      padding: '24px 32px',
                    },
                    profileSection__activeDevices: {
                      display: 'none',
                    },
                  },
                }}
                routing="hash"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';

const SHOOT_TYPES = [
  'Portrait', 'Wedding', 'Corporate/Headshot', 'Product/Commercial',
  'Family', 'Maternity', 'Events', 'Fashion', 'Real Estate', 'Food & Lifestyle',
];

const STEPS = ['Welcome', 'Studio', 'Preferences', 'Plan', 'Ready'];

const PLANS = [
  {
    key: 'trial',
    name: 'Free Trial',
    price: '$0',
    period: 'for 30 days',
    description: 'Full access to everything — no credit card required.',
    features: [
      'Unlimited client check-ins',
      'Feedback collection',
      'Email & newsletter tools',
      'Studio branding',
      'Dashboard analytics',
    ],
    badge: 'START HERE',
  },
  {
    key: 'pro',
    name: 'Professional',
    price: '$19',
    period: '/month',
    description: 'Continue with full access after your trial ends.',
    features: [
      'Everything in Free Trial',
      'Priority support',
      'Advanced analytics',
      'Custom email templates',
      'Client export & reports',
    ],
    badge: 'POPULAR',
  },
  {
    key: 'lifetime',
    name: 'Lifetime Pass',
    price: '$100',
    period: 'one-time',
    description: 'Permanent access to all current and future features.',
    features: [
      'Lifetime system access',
      'Everything in Professional',
      'No monthly renewal fees',
      'Priority support & updates',
      'Premium future templates',
    ],
    badge: 'BEST VALUE',
  },
];

/* Reusable back button */
function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', fontSize: 13,
        color: 'var(--color-text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('trial');
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

  const [studioData, setStudioData] = useState({ studioName: '', location: '', website: '', logoUrl: null });
  const [preferences, setPreferences] = useState({
    shootTypes: [], sessionReminders: true, autoThankYou: true,
  });

  function goTo(n) {
    setTransitioning(true);
    setTimeout(() => { setStep(n); setTransitioning(false); }, 300);
  }

  function toggleShootType(type) {
    setPreferences((p) => ({
      ...p,
      shootTypes: p.shootTypes.includes(type)
        ? p.shootTypes.filter((t) => t !== type)
        : [...p.shootTypes, type],
    }));
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setStudioData((p) => ({ ...p, logoUrl: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  async function completeOnboarding(planKey = 'trial', ref = null) {
    try {
      const updatePayload = {
        onboardingComplete: true,
        studioName: studioData.studioName || 'My Studio',
        location: studioData.location,
        website: studioData.website,
        logoUrl: studioData.logoUrl || null,
        shootTypes: preferences.shootTypes,
        sessionReminders: preferences.sessionReminders,
        autoThankYou: preferences.autoThankYou,
        plan: planKey,
        planStartDate: new Date().toISOString(),
      };
      if (ref) {
        updatePayload.paymentReference = ref;
      }
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          ...updatePayload,
        },
      });
      goTo(4);
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      localStorage.setItem('nuru_onboarding_complete', 'true');
      goTo(4);
    }
  }

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
          completeOnboarding(planKey, response?.reference);
        },
        onClose: () => {
          alert('Transaction cancelled. You can select the Free Trial to start using the system.');
        }
      });
      handler.openIframe();
    } catch (err) {
      console.error('Error starting Paystack payment:', err);
      alert('Error starting payment: ' + err.message);
    }
  };

  const w = {
    opacity: transitioning ? 0 : 1,
    transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
    transition: 'all 0.3s ease',
  };

  /* ---- Toggle component ---- */
  function Toggle({ on, onToggle, label, sub }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 400, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-faint)', fontWeight: 300 }}>{sub}</div>
        </div>
        <button onClick={onToggle} style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', flexShrink: 0,
          backgroundColor: on ? 'var(--color-accent-gold)' : 'var(--color-border)',
          position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s ease',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
            position: 'absolute', top: 3, left: on ? 23 : 3,
            transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Top bar */}
      <header style={{ padding: '0 48px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '0.04em', color: 'var(--color-text-primary)' }}>
          Nuru Workspace
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ width: i <= step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? 'var(--color-accent-gold)' : 'var(--color-border)', transition: 'all 0.4s ease' }} />
          ))}
        </div>
        {step < STEPS.length - 1 ? (
          <button onClick={completeOnboarding} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)', cursor: 'pointer', transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-muted)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}>
            Skip
          </button>
        ) : <div style={{ width: 40 }} />}
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div style={{ ...w, textAlign: 'center', maxWidth: 520 }}>
            <div style={{ width: 48, height: 1, backgroundColor: 'var(--color-accent-gold)', margin: '0 auto 32px' }} />
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 24 }}>Welcome to</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 24, lineHeight: 1.1, letterSpacing: '0.02em' }}>Nuru Workspace</h1>
            <p style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto 20px', fontWeight: 300 }}>
              Let's set up your photography studio in just a few steps. It only takes a minute.
            </p>
            <div style={{ width: 48, height: 1, backgroundColor: 'var(--color-accent-gold)', margin: '0 auto 40px', opacity: 0.5 }} />
            <button className="btn btn-primary" onClick={() => goTo(1)} style={{ height: 52, padding: '0 48px', fontSize: 13 }}>Get Started</button>
          </div>
        )}

        {/* Step 1 — Studio Profile */}
        {step === 1 && (
          <div style={{ ...w, width: '100%', maxWidth: 440 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', marginBottom: 16 }}>Step 1 of 4</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '0.02em' }}>Your Studio</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 300, marginBottom: 48, lineHeight: 1.7 }}>Tell us about your workspace. This helps personalize your experience.</p>

            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Studio Logo (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                {studioData.logoUrl ? (
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={studioData.logoUrl} alt="Logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => setStudioData((p) => ({ ...p, logoUrl: null }))}
                      style={{
                        position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: '0 0 0 4px',
                        backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: 64, height: 64, borderRadius: 8, border: '1px dashed var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                    id="logo-upload-onboarding"
                  />
                  <label
                    htmlFor="logo-upload-onboarding"
                    style={{
                      height: 36, padding: '0 16px', fontSize: 12, display: 'inline-flex', alignItems: 'center',
                      backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                      cursor: 'pointer', borderRadius: 4, transition: 'all 0.2s ease', color: 'var(--color-text-primary)',
                      fontFamily: 'inherit', fontWeight: 400
                    }}
                  >
                    Upload Logo
                  </label>
                  <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 4 }}>Autoresized to fit client forms.</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Studio Name</label>
              <input type="text" className="input-field" placeholder="e.g. Nuru Studios" value={studioData.studioName} onChange={(e) => setStudioData((p) => ({ ...p, studioName: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Location</label>
              <input type="text" className="input-field" placeholder="e.g. Accra, Ghana" value={studioData.location} onChange={(e) => setStudioData((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 48 }}>
              <label className="field-label">Website (Optional)</label>
              <input type="url" className="input-field" placeholder="https://yourstudio.com" value={studioData.website} onChange={(e) => setStudioData((p) => ({ ...p, website: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <BackBtn onClick={() => goTo(0)} />
              <button className="btn btn-primary" onClick={() => goTo(2)} style={{ height: 48, padding: '0 36px', fontSize: 13 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 2 — Preferences */}
        {step === 2 && (
          <div style={{ ...w, width: '100%', maxWidth: 520 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', marginBottom: 16 }}>Step 2 of 4</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '0.02em' }}>Preferences</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 300, marginBottom: 48, lineHeight: 1.7 }}>Select the shoot types you offer. You can change these later.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 48 }}>
              {SHOOT_TYPES.map((type) => {
                const sel = preferences.shootTypes.includes(type);
                return (
                  <button key={type} onClick={() => toggleShootType(type)} style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 400, border: '1px solid',
                    borderColor: sel ? 'var(--color-accent-gold)' : 'var(--color-border)',
                    backgroundColor: sel ? 'var(--color-accent-gold)' : 'transparent',
                    color: sel ? '#fff' : 'var(--color-text-muted)',
                    borderRadius: 24, cursor: 'pointer', transition: 'all 0.2s ease',
                  }}>{type}</button>
                );
              })}
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--color-border)', margin: '0 0 36px' }} />

            <Toggle on={preferences.sessionReminders} label="Session Reminders" sub="Email clients before upcoming sessions"
              onToggle={() => setPreferences((p) => ({ ...p, sessionReminders: !p.sessionReminders }))} />
            <div style={{ height: 1, backgroundColor: 'var(--color-border)', opacity: 0.5 }} />
            <Toggle on={preferences.autoThankYou} label="Auto Thank-You Emails" sub="Send a follow-up after each session"
              onToggle={() => setPreferences((p) => ({ ...p, autoThankYou: !p.autoThankYou }))} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
              <BackBtn onClick={() => goTo(1)} />
              <button className="btn btn-primary" onClick={() => goTo(3)} style={{ height: 48, padding: '0 36px', fontSize: 13 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — Choose Plan */}
        {step === 3 && (
          <div style={{ ...w, width: '100%', maxWidth: 900 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', marginBottom: 16 }}>Step 3 of 4</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '0.02em' }}>Choose Your Plan</h2>
              <p style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 300, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
                Start with a free 30-day trial. No credit card needed.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {PLANS.map((plan) => {
                const active = selectedPlan === plan.key;
                return (
                  <button
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    style={{
                      background: active ? 'var(--color-bg-primary)' : 'var(--color-bg-primary)',
                      border: active ? '2px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: '36px 28px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      boxShadow: active ? '0 4px 24px rgba(191,155,80,0.12)' : 'none',
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: active ? 'var(--color-accent-gold)' : 'var(--color-text-faint)',
                      marginBottom: 16,
                    }}>
                      {plan.badge}
                    </div>

                    {/* Plan Name */}
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
                      color: 'var(--color-text-primary)', marginBottom: 8,
                    }}>
                      {plan.name}
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                      <span style={{ fontSize: 40, fontWeight: 300, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 300 }}>
                        {plan.period}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 300, lineHeight: 1.6, marginBottom: 24 }}>
                      {plan.description}
                    </p>

                    {/* Features */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 300, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Selected indicator */}
                    {active && (
                      <div style={{
                        position: 'absolute', top: 16, right: 16, width: 24, height: 24,
                        borderRadius: '50%', backgroundColor: 'var(--color-accent-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Note */}
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-faint)', fontWeight: 300, marginTop: 24, fontStyle: 'italic' }}>
              Your free trial starts today. You won't be charged until 30 days from now.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
              <BackBtn onClick={() => goTo(2)} />
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedPlan === 'trial') {
                    completeOnboarding('trial');
                  } else {
                    handlePaystackPayment(selectedPlan);
                  }
                }}
                style={{ height: 48, padding: '0 36px', fontSize: 13 }}
              >
                {selectedPlan === 'trial' ? 'Start Free Trial' : `Pay ${selectedPlan === 'lifetime' ? '$100' : '$19'} with Paystack`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — All Set */}
        {step === 4 && (
          <div style={{ ...w, textAlign: 'center', maxWidth: 480 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--color-accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 16, letterSpacing: '0.02em' }}>
              You're all set.
            </h2>

            <p style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--color-text-muted)', maxWidth: 380, margin: '0 auto 8px', fontWeight: 300 }}>
              {studioData.studioName ? `${studioData.studioName} is ready to go.` : 'Your workspace is ready to go.'}{' '}
              Start by checking in your first client.
            </p>

            <p style={{ fontSize: 13, color: 'var(--color-accent-gold)', fontWeight: 400, marginBottom: 8 }}>
              {selectedPlan === 'trial' ? '30-day free trial activated' : selectedPlan === 'lifetime' ? 'Lifetime pass activated' : 'Professional plan selected'}
            </p>

            <div style={{ width: 48, height: 1, backgroundColor: 'var(--color-accent-gold)', margin: '0 auto 40px', opacity: 0.5 }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ height: 52, padding: '0 48px', fontSize: 13 }}>Go to Dashboard</button>
              <button className="btn btn-ghost" onClick={() => navigate('/new-client')} style={{ height: 52, padding: '0 36px', fontSize: 13 }}>Add First Client</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

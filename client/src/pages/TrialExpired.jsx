import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { useStudioProfile } from '../hooks/useStudioProfile';

export default function TrialExpired() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { studioName } = useStudioProfile();
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
      if (!user) {
        alert('You must be signed in to purchase a plan.');
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress || '';
      if (!window.PaystackPop) {
        alert('Paystack SDK failed to load. Please check your internet connection.');
        return;
      }

      const priceUSD = planKey === 'lifetime' ? 100 : 19;
      const priceGHS = Math.round(priceUSD * usdToGhsRate);
      console.log(`Converting $${priceUSD} USD to GHS at rate: ${usdToGhsRate} = GHS ${priceGHS}`);

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_a6978513a7d8178d623bf0ef2b75dd28cc98efb2',
        email: email,
        amount: priceGHS * 100, // in cents/kobo
        currency: 'GHS',
        metadata: {
          userId: user?.id || '',
          planKey: planKey,
          custom_fields: [
            {
              display_name: "Plan Key",
              variable_name: "plan_key",
              value: planKey
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user?.id || ''
            }
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
            alert('Payment successful! Your account has been upgraded.');
            navigate('/dashboard');
          }).catch((err) => {
            console.error('Failed to update user plan:', err);
            alert('Payment succeeded but we failed to update your profile. Contact support with reference: ' + response?.reference);
          });
        },
        onClose: () => {
          alert('Transaction cancelled.');
        }
      });
      handler.openIframe();
    } catch (err) {
      console.error('Error starting Paystack payment:', err);
      alert('Error starting payment: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="animate-fade-in-up" style={{ textAlign: 'center', maxWidth: 520, opacity: 0 }}>

        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 300, color: 'var(--color-text-primary)', marginBottom: 16, letterSpacing: '0.02em' }}>
          Trial Ended
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text-muted)', fontWeight: 300, marginBottom: 8, maxWidth: 400, margin: '0 auto 24px' }}>
          Your 30-day free trial for <strong style={{ fontWeight: 500 }}>{studioName}</strong> has ended. Upgrade to continue managing your studio.
        </p>

        {/* Plan cards */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            justifyContent: 'center', 
            gap: 24, 
            margin: '0 auto 32px',
            maxWidth: 780
          }}
        >
          {/* Card 1: Subscription */}
          <div 
            style={{ 
              border: '1px solid var(--color-border)', 
              borderRadius: 12, 
              padding: '32px 28px', 
              textAlign: 'left', 
              width: '100%',
              maxWidth: 340, 
              backgroundColor: 'var(--color-bg-secondary)', 
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              PROFESSIONAL SUBSCRIPTION
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 44, fontWeight: 300, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>$19</span>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 300 }}>/month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
              {['Unlimited client check-ins', 'Feedback & analytics', 'Email & newsletter tools', 'Studio branding', 'Standard support'].map((f) => (
                <li key={f} style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 300, padding: '5px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => handlePaystackPayment('pro')}
              style={{ height: 48, fontSize: 13, width: '100%' }}
            >
              Subscribe Monthly
            </button>
          </div>

          {/* Card 2: One-time payment (Featured / Gold Border) */}
          <div 
            style={{ 
              border: '2px solid var(--color-accent-gold)', 
              borderRadius: 12, 
              padding: '32px 28px', 
              textAlign: 'left', 
              width: '100%',
              maxWidth: 340, 
              backgroundColor: 'var(--color-bg-secondary)', 
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ position: 'absolute', top: -12, right: 24, backgroundColor: 'var(--color-accent-gold)', color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
              BEST VALUE
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', marginBottom: 12 }}>
              LIFETIME PASS
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 44, fontWeight: 300, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>$100</span>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 300 }}>one-time</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
              {['Lifetime access to all features', 'Unlimited client check-ins', 'Feedback & analytics', 'Email & newsletter tools', 'Priority support & updates', 'No monthly renewal fees'].map((f) => (
                <li key={f} style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 300, padding: '5px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="btn btn-primary btn-full"
              onClick={() => handlePaystackPayment('lifetime')}
              style={{ height: 48, fontSize: 13, width: '100%' }}
            >
              Get Lifetime Access
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--color-text-faint)', fontWeight: 300, marginBottom: 24, fontStyle: 'italic' }}>
          Questions? Reach out to support for help.
        </p>

        <button
          onClick={async () => { await signOut(); navigate('/'); }}
          style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', cursor: 'pointer', transition: 'color 0.2s ease' }}
          onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

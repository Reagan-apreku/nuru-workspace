import { useParams } from 'react-router-dom';
import { useReceipts } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useUser } from '@clerk/react';
import { useEffect } from 'react';

export default function PrintReceipt() {
  const { id } = useParams();
  const { data: receipts, isLoading, error } = useReceipts();
  const { studioName, location, website, logoUrl } = useStudioProfile();
  const { user } = useUser();

  const receipt = receipts?.find(r => r.id === id);

  useEffect(() => {
    if (receipt) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [receipt]);

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-body)' }}>Loading Receipt Details...</div>;
  }

  if (error || !receipt) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red', fontFamily: 'var(--font-body)' }}>Receipt not found or failed to load.</div>;
  }

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';
  const formattedAmount = `${currency} ${parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const photographerEmail = user?.primaryEmailAddress?.emailAddress;
  const photographerPhone = user?.primaryPhoneNumber?.phoneNumber;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '40px', background: '#fff', border: '1px solid #ddd', borderRadius: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
        <button className="btn" onClick={() => window.history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>
          ← Back
        </button>
        <button className="btn btn-accent" onClick={() => window.print()} style={{ height: 38, padding: '0 16px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Print / Save as PDF
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2f855a', paddingBottom: 20, marginBottom: 30 }}>
        <div>
          {logoUrl && <img src={logoUrl} alt={studioName} style={{ maxHeight: 60, marginBottom: 12, display: 'block' }} />}
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 700, color: '#1a1a1a' }}>{studioName}</h1>
          <div style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.4 }}>
            {location && <div>{location}</div>}
            {website && <div>{website}</div>}
            {photographerPhone && <div>Phone: {photographerPhone}</div>}
            {photographerEmail && <div>Email: {photographerEmail}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 22, margin: 0, fontWeight: 700, color: '#2f855a', letterSpacing: '0.05em' }}>RECEIPT</h2>
            <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}># {receipt.receipt_number}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Received From</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{receipt.client_name}</div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 2 }}>{receipt.client_email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Receipt Details</div>
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div><strong>Payment Date:</strong> {receipt.payment_date}</div>
            {receipt.payment_method && <div><strong>Payment Method:</strong> {receipt.payment_method}</div>}
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead>
          <tr style={{ background: '#f0fff4', borderBottom: '2px solid #cbd5e0' }}>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, textTransform: 'uppercase', color: '#2f855a' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '12px', fontSize: 12, textTransform: 'uppercase', color: '#2f855a' }}>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontSize: 14 }}>
                  <div style={{ fontWeight: 600, color: '#2d3748' }}>{item.description}</div>
                  {item.quantity && item.unit_price && (
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                      {item.quantity} units x {currency} {parseFloat(item.unit_price).toFixed(2)}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600, fontSize: 14, verticalAlign: 'top' }}>
                  {currency} {parseFloat(item.amount || (item.quantity * item.unit_price) || 0).toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontSize: 14 }}>Payment for photography services / invoice reconciliation</td>
              <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600, fontSize: 14 }}>{formattedAmount}</td>
            </tr>
          )}
          <tr style={{ background: '#f0fff4', borderTop: '2px solid #cbd5e0' }}>
            <td style={{ padding: '12px', fontWeight: 700, fontSize: 16, color: '#2f855a' }}>Total Paid</td>
            <td style={{ textAlign: 'right', padding: '12px', fontWeight: 700, fontSize: 16, color: '#2f855a' }}>{formattedAmount}</td>
          </tr>
        </tbody>
      </table>

      {receipt.notes && (
        <div style={{ background: '#faf9f6', padding: 20, borderRadius: 4, borderLeft: '3px solid #2f855a', marginBottom: 40 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Payment Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#444' }}>{receipt.notes}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 20 }}>
        Payment received and confirmed. Thank you!
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          div {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

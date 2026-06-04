import { useParams } from 'react-router-dom';
import { useReceipts } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useEffect } from 'react';

export default function PrintReceipt() {
  const { id } = useParams();
  const { data: receipts, isLoading, error } = useReceipts();
  const { studioName } = useStudioProfile();

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

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '40px', background: '#fff', border: '1px solid #ddd', borderRadius: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
        <button className="btn" onClick={() => window.history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>
          ← Back
        </button>
        <button className="btn btn-accent" onClick={() => window.print()} style={{ height: 38, padding: '0 16px', background: 'var(--color-text-primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Print / Save as PDF
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2f855a', paddingBottom: 20, marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 300, letterSpacing: '0.05em' }}>{studioName}</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 20, margin: 0, fontWeight: 600, color: '#2f855a' }}>RECEIPT</h2>
          <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}># {receipt.receipt_number}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Received From</div>
          <div style={{ fontWeight: 600 }}>{receipt.client_name}</div>
          <div style={{ color: '#555' }}>{receipt.client_email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Receipt Details</div>
          <div><strong>Payment Date:</strong> {receipt.payment_date}</div>
          {receipt.payment_method && <div><strong>Payment Method:</strong> {receipt.payment_method}</div>}
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
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '12px', fontSize: 14 }}>Payment for photography services / invoice reconciliation</td>
            <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600, fontSize: 14 }}>{formattedAmount}</td>
          </tr>
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

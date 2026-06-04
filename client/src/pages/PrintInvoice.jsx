import { useParams } from 'react-router-dom';
import { useInvoices } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useEffect } from 'react';

export default function PrintInvoice() {
  const { id } = useParams();
  const { data: invoices, isLoading, error } = useInvoices();
  const { studioName } = useStudioProfile();

  const invoice = invoices?.find(i => i.id === id);

  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-body)' }}>Loading Invoice Details...</div>;
  }

  if (error || !invoice) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red', fontFamily: 'var(--font-body)' }}>Invoice not found or failed to load.</div>;
  }

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';
  const formattedAmount = `${currency} ${parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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

      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 300, letterSpacing: '0.05em' }}>{studioName}</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: 20, margin: 0, fontWeight: 600, color: '#555' }}>INVOICE</h2>
          <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}># {invoice.invoice_number}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Billed To</div>
          <div style={{ fontWeight: 600 }}>{invoice.client_name}</div>
          <div style={{ color: '#555' }}>{invoice.client_email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Invoice Details</div>
          <div><strong>Date Issued:</strong> {invoice.issue_date}</div>
          {invoice.due_date && <div><strong>Due Date:</strong> {invoice.due_date}</div>}
          <div><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{invoice.status}</span></div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead>
          <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, textTransform: 'uppercase', color: '#555' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '12px', fontSize: 12, textTransform: 'uppercase', color: '#555' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '12px', fontSize: 14 }}>Photography Services / Custom Package</td>
            <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600, fontSize: 14 }}>{formattedAmount}</td>
          </tr>
          <tr style={{ background: '#fdfdfd', borderTop: '2px solid #ddd' }}>
            <td style={{ padding: '12px', fontWeight: 700, fontSize: 16 }}>Total Due</td>
            <td style={{ textAlign: 'right', padding: '12px', fontWeight: 700, fontSize: 16 }}>{formattedAmount}</td>
          </tr>
        </tbody>
      </table>

      {invoice.notes && (
        <div style={{ background: '#faf9f6', padding: 20, borderRadius: 4, borderLeft: '3px solid #ccc', marginBottom: 40 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#777', fontWeight: 600, marginBottom: 6 }}>Notes & Terms</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: '#444' }}>{invoice.notes}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 20 }}>
        Thank you for your business! If you have any questions, please contact {studioName}.
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

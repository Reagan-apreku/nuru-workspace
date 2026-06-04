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
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading Receipt Details...</div>;
  }

  if (error || !receipt) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red', fontFamily: 'Inter, sans-serif' }}>Receipt not found or failed to load.</div>;
  }

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';
  const formattedAmount = `${currency} ${parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const photographerEmail = user?.primaryEmailAddress?.emailAddress;
  const photographerPhone = user?.primaryPhoneNumber?.phoneNumber;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <div style={{
        maxWidth: 820,
        margin: '40px auto',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#1e293b',
        background: '#fff',
      }}>

        {/* Top Action Bar — hidden on print */}
        <div className="no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 32, padding: '16px 0',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <button onClick={() => window.history.back()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 40, padding: '0 20px',
            border: '1px solid #d1d5db', background: '#fff', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151',
          }}>
            ← Back to Dashboard
          </button>
          <button onClick={() => window.print()} style={{
            height: 40, padding: '0 24px',
            background: '#166534', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
          }}>
            🖨 Print / Save as PDF
          </button>
        </div>

        {/* ============ RECEIPT DOCUMENT ============ */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          
          {/* Accent top stripe — emerald/gold for receipts */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #166534 0%, #22c55e 50%, #c9a96e 100%)' }} />

          {/* Document body */}
          <div style={{ padding: '48px 52px 40px' }}>

            {/* Header: Studio info + RECEIPT title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              <div>
                {logoUrl && (
                  <img src={logoUrl} alt={studioName} style={{
                    maxHeight: 56, marginBottom: 14, display: 'block',
                    objectFit: 'contain',
                  }} />
                )}
                <h1 style={{
                  fontSize: 22, margin: 0, fontWeight: 700,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#0f172a', letterSpacing: '-0.01em',
                }}>
                  {studioName}
                </h1>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.7 }}>
                  {location && <div>{location}</div>}
                  {website && <div>{website}</div>}
                  {photographerPhone && <div>{photographerPhone}</div>}
                  {photographerEmail && <div>{photographerEmail}</div>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 style={{
                  fontSize: 36, margin: 0, fontWeight: 300,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#86efac', letterSpacing: '0.12em',
                }}>
                  RECEIPT
                </h2>
                <div style={{
                  fontSize: 13, color: '#475569', marginTop: 6,
                  fontWeight: 600, fontFamily: '"Inter", sans-serif',
                }}>
                  {receipt.receipt_number}
                </div>
                <div style={{
                  marginTop: 12, display: 'inline-block',
                  padding: '5px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#166534', backgroundColor: '#f0fdf4',
                  border: '1px solid #16653422',
                }}>
                  ✓ Payment Confirmed
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, #166534, #e2e8f0 40%, transparent)', marginBottom: 32 }} />

            {/* Received From + Receipt Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
              <div>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: '#94a3b8', fontWeight: 600, marginBottom: 10,
                }}>
                  Received From
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                  {receipt.client_name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{receipt.client_email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: '#94a3b8', fontWeight: 600, marginBottom: 10,
                }}>
                  Payment Details
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#475569' }}>
                  <div><span style={{ color: '#94a3b8', fontWeight: 500 }}>Payment Date:</span> {formatDate(receipt.payment_date)}</div>
                  {receipt.payment_method && (
                    <div><span style={{ color: '#94a3b8', fontWeight: 500 }}>Method:</span> {receipt.payment_method}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff',
                    background: '#166534',
                  }}>
                    Description
                  </th>
                  <th style={{
                    textAlign: 'center', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#166534',
                  }}>
                    Qty
                  </th>
                  <th style={{
                    textAlign: 'right', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#166534',
                  }}>
                    Unit Price
                  </th>
                  <th style={{
                    textAlign: 'right', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#166534',
                  }}>
                    Amount Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((item, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f0fdf4';
                    return (
                      <tr key={idx} style={{ background: rowBg }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'center', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                          {parseFloat(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                          {currency} {parseFloat(item.amount || (item.quantity * item.unit_price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500 }}>Payment for photography services</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'center', color: '#64748b' }}>1</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', color: '#64748b' }}>{parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{formattedAmount}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Row */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', marginTop: 0, marginBottom: 40,
            }}>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                padding: '16px 28px', minWidth: 240,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {receipt.items && receipt.items.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>{formattedAmount}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: receipt.items && receipt.items.length > 1 ? '1px solid #86efac' : 'none',
                  paddingTop: receipt.items && receipt.items.length > 1 ? 8 : 0,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Total Paid</span>
                  <span style={{
                    fontSize: 20, fontWeight: 700, color: '#166534',
                    fontFamily: '"Playfair Display", Georgia, serif',
                  }}>
                    {formattedAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Large "PAID" Watermark Stamp */}
            <div style={{
              textAlign: 'center', marginBottom: 32,
            }}>
              <span style={{
                display: 'inline-block',
                padding: '8px 40px',
                border: '3px solid #16a34a',
                borderRadius: 8,
                fontSize: 28, fontWeight: 800,
                letterSpacing: '0.2em',
                color: '#16a34a',
                transform: 'rotate(-3deg)',
                opacity: 0.35,
                fontFamily: '"Inter", sans-serif',
              }}>
                PAID
              </span>
            </div>

            {/* Notes */}
            {receipt.notes && (
              <div style={{
                background: '#f0fdf4', padding: '16px 20px',
                borderLeft: '3px solid #22c55e', marginBottom: 40,
                borderRadius: '0 6px 6px 0',
              }}>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: '#166534', fontWeight: 600, marginBottom: 6,
                }}>
                  Payment Notes
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.7, color: '#14532d' }}>{receipt.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              borderTop: '1px solid #e2e8f0', paddingTop: 28,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                  Payment received and confirmed by <span style={{ fontWeight: 600, color: '#475569' }}>{studioName}</span>.
                  <br />Thank you for your trust. We look forward to working with you again.
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 180 }}>
                <div style={{
                  borderBottom: '1px solid #cbd5e1',
                  marginBottom: 6, height: 28,
                }} />
                <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Authorized Signature
                </div>
              </div>
            </div>

          </div>

          {/* Accent bottom stripe */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #c9a96e 0%, #22c55e 50%, #166534 100%)' }} />
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { margin: 0.4in; }
          }
        `}</style>
      </div>
    </>
  );
}

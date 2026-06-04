import { useParams } from 'react-router-dom';
import { useInvoices } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useUser } from '@clerk/react';
import { useEffect } from 'react';

export default function PrintInvoice() {
  const { id } = useParams();
  const { data: invoices, isLoading, error } = useInvoices();
  const { studioName, location, website, logoUrl } = useStudioProfile();
  const { user } = useUser();

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
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading Invoice Details...</div>;
  }

  if (error || !invoice) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red', fontFamily: 'Inter, sans-serif' }}>Invoice not found or failed to load.</div>;
  }

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';
  const formattedAmount = `${currency} ${parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const photographerEmail = user?.primaryEmailAddress?.emailAddress;
  const photographerPhone = user?.primaryPhoneNumber?.phoneNumber;

  const statusColor = invoice.status === 'paid' ? '#16a34a' : invoice.status === 'cancelled' ? '#dc2626' : '#2563eb';
  const statusBg = invoice.status === 'paid' ? '#f0fdf4' : invoice.status === 'cancelled' ? '#fef2f2' : '#eff6ff';

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
            transition: 'all 0.2s',
          }}>
            ← Back to Dashboard
          </button>
          <button onClick={() => window.print()} style={{
            height: 40, padding: '0 24px',
            background: '#1e293b', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
          }}>
            🖨 Print / Save as PDF
          </button>
        </div>

        {/* ============ INVOICE DOCUMENT ============ */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          
          {/* Accent top stripe */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #1e293b 0%, #64748b 50%, #c9a96e 100%)' }} />

          {/* Document body */}
          <div style={{ padding: '48px 52px 40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)' }}>

            {/* Flex-grow content area — pushes footer to bottom */}
            <div style={{ flex: 1 }}>

            {/* Header: Studio info + INVOICE title */}
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
                  color: '#94a3b8', letterSpacing: '0.12em',
                }}>
                  INVOICE
                </h2>
                <div style={{
                  fontSize: 13, color: '#475569', marginTop: 6,
                  fontWeight: 600, fontFamily: '"Inter", sans-serif',
                }}>
                  {invoice.invoice_number}
                </div>
                <div style={{
                  marginTop: 12, display: 'inline-block',
                  padding: '5px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: statusColor, backgroundColor: statusBg,
                  border: `1px solid ${statusColor}22`,
                }}>
                  {invoice.status}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, #1e293b, #e2e8f0 40%, transparent)' , marginBottom: 32 }} />

            {/* Bill To + Invoice Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
              <div>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: '#94a3b8', fontWeight: 600, marginBottom: 10,
                }}>
                  Billed To
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                  {invoice.client_name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{invoice.client_email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: '#94a3b8', fontWeight: 600, marginBottom: 10,
                }}>
                  Invoice Details
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#475569' }}>
                  <div><span style={{ color: '#94a3b8', fontWeight: 500 }}>Date Issued:</span> {formatDate(invoice.issue_date)}</div>
                  {invoice.due_date && <div><span style={{ color: '#94a3b8', fontWeight: 500 }}>Due Date:</span> {formatDate(invoice.due_date)}</div>}
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
                    background: '#1e293b', borderRadius: 0,
                  }}>
                    Description
                  </th>
                  <th style={{
                    textAlign: 'center', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#1e293b',
                  }}>
                    Qty
                  </th>
                  <th style={{
                    textAlign: 'right', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#1e293b',
                  }}>
                    Unit Price
                  </th>
                  <th style={{
                    textAlign: 'right', padding: '14px 16px',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontWeight: 600, color: '#fff', background: '#1e293b',
                  }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
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
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500 }}>Photography Services / Custom Package</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'center', color: '#64748b' }}>1</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', color: '#64748b' }}>{parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
                background: '#f8fafc', border: '1px solid #e2e8f0',
                padding: '16px 28px', minWidth: 240,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {invoice.items && invoice.items.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>{formattedAmount}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: invoice.items && invoice.items.length > 1 ? '1px solid #cbd5e1' : 'none',
                  paddingTop: invoice.items && invoice.items.length > 1 ? 8 : 0,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Total Due</span>
                  <span style={{
                    fontSize: 20, fontWeight: 700, color: '#0f172a',
                    fontFamily: '"Playfair Display", Georgia, serif',
                  }}>
                    {formattedAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{
                background: '#fefce8', padding: '16px 20px',
                borderLeft: '3px solid #c9a96e', marginBottom: 40,
                borderRadius: '0 6px 6px 0',
              }}>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: '#92400e', fontWeight: 600, marginBottom: 6,
                }}>
                  Notes & Terms
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.7, color: '#78350f' }}>{invoice.notes}</div>
              </div>
            )}

            </div>{/* End flex-grow content area */}

            {/* Footer — always at bottom */}
            <div style={{
              borderTop: '1px solid #e2e8f0', paddingTop: 28,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                  Thank you for choosing <span style={{ fontWeight: 600, color: '#475569' }}>{studioName}</span>.
                  <br />We appreciate your business and look forward to working with you again.
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
          <div style={{ height: 5, background: 'linear-gradient(90deg, #c9a96e 0%, #64748b 50%, #1e293b 100%)' }} />
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

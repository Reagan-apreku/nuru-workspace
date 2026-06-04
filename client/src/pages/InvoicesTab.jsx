import { useState } from 'react';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, useDeleteInvoice, useClients } from '../hooks/useApi';

export default function InvoicesTab() {
  const { data: invoices, isLoading, error } = useInvoices();
  const { data: clients } = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    amount: '',
    dueDate: '',
    notes: '',
  });

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';

  const handleClientChange = (clientId) => {
    if (!clientId) {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientEmail: '',
      }));
      return;
    }

    const selectedClient = clients?.find((c) => c.id === clientId);
    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        clientId,
        clientName: `${selectedClient.first_name} ${selectedClient.last_name}`,
        clientEmail: selectedClient.email,
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail || !formData.amount) {
      alert('Please fill out all required fields.');
      return;
    }

    // Auto-generate invoice number based on date and number of invoices
    const count = invoices ? invoices.length + 1 : 1;
    const invNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    try {
      await createInvoice.mutateAsync({
        invoice_number: invNumber,
        client_id: formData.clientId || null,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        amount: parseFloat(formData.amount),
        status: 'sent',
        dueDate: formData.dueDate || null,
        notes: formData.notes,
      });

      setShowCreateModal(false);
      setFormData({
        clientId: '',
        clientName: '',
        clientEmail: '',
        amount: '',
        dueDate: '',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Error creating invoice. Please check the console.');
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Mark this invoice as Paid? This will also automatically generate a Receipt.')) {
      try {
        await updateInvoiceStatus.mutateAsync({ id, status: 'paid' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCancelInvoice = async (id) => {
    if (window.confirm('Cancel this invoice?')) {
      try {
        await updateInvoiceStatus.mutateAsync({ id, status: 'cancelled' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDelete = async (id, number) => {
    if (window.confirm(`Delete invoice ${number}?`)) {
      try {
        await deleteInvoice.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
        Loading invoices...
      </div>
    );
  }

  if (error) {
    // Graceful error fallback if user has not run migration yet
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
        <h3 style={{ fontSize: 20, marginBottom: 12, color: 'var(--color-error)' }}>Invoices Table Not Configured</h3>
        <p style={{ fontSize: 14, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
          It looks like the <code>invoices</code> database table hasn't been set up in your Supabase project yet.
          Please run the database schema migrations to unlock invoice tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--color-text-primary)' }}>
          Invoices
        </h2>
        <button className="btn btn-accent" onClick={() => setShowCreateModal(true)}>
          Create Invoice
        </button>
      </div>

      {/* Invoices List */}
      {!invoices || invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: 16 }}>
          No invoices created yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 6, backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}>
                {['Invoice #', 'Client', 'Amount', 'Status', 'Issued', 'Due', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {inv.invoice_number}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{inv.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{inv.client_email}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {currency} {parseFloat(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        backgroundColor:
                          inv.status === 'paid'
                            ? '#eafaf1'
                            : inv.status === 'sent'
                            ? '#e8f4fd'
                            : inv.status === 'cancelled'
                            ? '#fce8e6'
                            : '#f1f3f4',
                        color:
                          inv.status === 'paid'
                            ? '#11a355'
                            : inv.status === 'sent'
                            ? '#1a73e8'
                            : inv.status === 'cancelled'
                            ? '#d93025'
                            : '#5f6368',
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <>
                          <button
                            title="Mark as Paid"
                            onClick={() => handleMarkAsPaid(inv.id)}
                            style={{ background: 'none', border: 'none', color: '#11a355', cursor: 'pointer', padding: 4 }}
                          >
                            ✓ Paid
                          </button>
                          <button
                            title="Cancel Invoice"
                            onClick={() => handleCancelInvoice(inv.id)}
                            style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', padding: 4 }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        title="Delete Invoice"
                        onClick={() => handleDelete(inv.id, inv.invoice_number)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', padding: 4 }}
                        onMouseEnter={(e) => (e.target.style.color = 'var(--color-error)')}
                        onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="animate-scale-in"
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              width: '100%',
              maxWidth: 500,
              padding: 32,
              border: '1px solid var(--color-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, marginBottom: 24, color: 'var(--color-text-primary)' }}>
              Create Invoice
            </h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Link to Existing Client (Optional)
                </label>
                <select
                  className="select-field"
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="">-- Select Client --</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.clientName}
                  onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Client Email *
                </label>
                <input
                  type="email"
                  className="input-field"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData((p) => ({ ...p, clientEmail: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  required
                  placeholder="e.g. 1500.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Notes / Description
                </label>
                <textarea
                  className="textarea-field"
                  placeholder="e.g. Wedding Package - Deposit payment"
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

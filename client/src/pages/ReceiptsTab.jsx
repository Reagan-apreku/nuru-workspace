import { useState } from 'react';
import { useReceipts, useCreateReceipt, useDeleteReceipt, useClients, useInvoices, useUpdateInvoiceStatus } from '../hooks/useApi';

export default function ReceiptsTab() {
  const { data: receipts, isLoading, error } = useReceipts();
  const { data: clients } = useClients();
  const { data: invoices } = useInvoices();
  const createReceipt = useCreateReceipt();
  const deleteReceipt = useDeleteReceipt();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    clientName: '',
    clientEmail: '',
    amount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';

  const handleInvoiceChange = (invoiceId) => {
    if (!invoiceId) {
      setFormData((prev) => ({
        ...prev,
        invoiceId: '',
        clientName: '',
        clientEmail: '',
        amount: '',
      }));
      return;
    }

    const selectedInv = invoices?.find((i) => i.id === invoiceId);
    if (selectedInv) {
      setFormData((prev) => ({
        ...prev,
        invoiceId,
        clientName: selectedInv.client_name,
        clientEmail: selectedInv.client_email,
        amount: selectedInv.amount,
        notes: `Payment for Invoice ${selectedInv.invoice_number}`,
      }));
    }
  };

  const handleClientChange = (clientName) => {
    // If client is selected from clients list, update both name and email
    const selectedClient = clients?.find((c) => `${c.first_name} ${c.last_name}` === clientName);
    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        clientName,
        clientEmail: selectedClient.email,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientName,
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail || !formData.amount) {
      alert('Please fill out all required fields.');
      return;
    }

    // Auto-generate receipt number based on receipts count
    const count = receipts ? receipts.length + 1 : 1;
    const recNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    try {
      await createReceipt.mutateAsync({
        receipt_number: recNumber,
        invoice_id: formData.invoiceId || null,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        amount: parseFloat(formData.amount),
        payment_method: formData.paymentMethod,
        payment_date: formData.paymentDate,
        notes: formData.notes,
      });

      // If tied to an invoice, mark invoice as paid
      if (formData.invoiceId) {
        await updateInvoiceStatus.mutateAsync({
          id: formData.invoiceId,
          status: 'paid',
        });
      }

      setShowCreateModal(false);
      setFormData({
        invoiceId: '',
        clientName: '',
        clientEmail: '',
        amount: '',
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
      console.error('Failed to create receipt:', err);
      alert('Error creating receipt. Please check the console.');
    }
  };

  const handleDelete = async (id, number) => {
    if (window.confirm(`Delete receipt ${number}?`)) {
      try {
        await deleteReceipt.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
        Loading receipts...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
        <h3 style={{ fontSize: 20, marginBottom: 12, color: 'var(--color-error)' }}>Receipts Table Not Configured</h3>
        <p style={{ fontSize: 14, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
          It looks like the <code>receipts</code> database table hasn't been set up in your Supabase project yet.
          Please run the database schema migrations to unlock receipt tracking.
        </p>
      </div>
    );
  }

  // Get unpaid invoices for selection
  const unpaidInvoices = invoices?.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled') || [];

  return (
    <div className="animate-fade-in" style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--color-text-primary)' }}>
          Receipts
        </h2>
        <button className="btn btn-accent" onClick={() => setShowCreateModal(true)}>
          Create Receipt
        </button>
      </div>

      {/* Receipts List */}
      {!receipts || receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: 16 }}>
          No receipts created yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 6, backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}>
                {['Receipt #', 'Client', 'Amount', 'Method', 'Payment Date', 'Notes', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {rec.receipt_number}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{rec.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{rec.client_email}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>
                    +{currency} {parseFloat(rec.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        backgroundColor: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {rec.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {new Date(rec.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.notes}>
                    {rec.notes || '—'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      title="Delete Receipt"
                      onClick={() => handleDelete(rec.id, rec.receipt_number)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', padding: 4 }}
                      onMouseEnter={(e) => (e.target.style.color = 'var(--color-error)')}
                      onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-faint)')}
                    >
                      Delete
                    </button>
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
              Create Receipt
            </h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Pay Unpaid Invoice (Optional)
                </label>
                <select
                  className="select-field"
                  value={formData.invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                >
                  <option value="">-- Choose Invoice --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} ({inv.client_name} - {currency} {inv.amount})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Client Name *
                </label>
                <select
                  className="select-field"
                  disabled={!!formData.invoiceId}
                  value={formData.clientName}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="">-- Select Client or Choose below --</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={`${c.first_name} ${c.last_name}`}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
                {!formData.invoiceId && (
                  <input
                    type="text"
                    className="input-field"
                    style={{ marginTop: 8 }}
                    required
                    placeholder="Or type custom name"
                    value={formData.clientName}
                    onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                  />
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Client Email *
                </label>
                <input
                  type="email"
                  className="input-field"
                  required
                  disabled={!!formData.invoiceId}
                  placeholder="e.g. client@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData((p) => ({ ...p, clientEmail: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Amount Paid ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  required
                  disabled={!!formData.invoiceId}
                  placeholder="e.g. 1500.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Payment Method
                </label>
                <select
                  className="select-field"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentDate: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Notes / Reference
                </label>
                <textarea
                  className="textarea-field"
                  placeholder="e.g. Cash payment received by hand"
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
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

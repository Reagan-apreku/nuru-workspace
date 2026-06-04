import { useState } from 'react';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, useDeleteInvoice, useClients, useSendInvoiceEmail } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useUser } from '@clerk/react';

export default function InvoicesTab() {
  const { data: invoices, isLoading, error } = useInvoices();
  const { data: clients } = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const sendInvoiceEmail = useSendInvoiceEmail();

  const { studioName, location, website, logoUrl } = useStudioProfile();
  const { user } = useUser();

  const photographerEmail = user?.primaryEmailAddress?.emailAddress;
  const photographerPhone = user?.primaryPhoneNumber?.phoneNumber;

  const [sendingEmailId, setSendingEmailId] = useState(null);

  const handleSendEmail = async (id) => {
    try {
      setSendingEmailId(id);
      await sendInvoiceEmail.mutateAsync(id);
      alert('Invoice email sent successfully to the client!');
    } catch (err) {
      console.error(err);
      alert('Failed to send email. Make sure your RESEND_API_KEY is configured.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    dueDate: '',
    notes: '',
  });

  const [items, setItems] = useState([
    { description: 'Portrait Session / Shooting Fee', quantity: 1, unit_price: '500' }
  ]);

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

  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return newItems;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const calculatedTotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)),
    0
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail) {
      alert('Please fill out all required fields.');
      return;
    }

    if (items.some(item => !item.description || !item.unit_price)) {
      alert('Please fill in a description and price for all items.');
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
        amount: calculatedTotal,
        status: 'sent',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: formData.dueDate || null,
        notes: formData.notes,
        items: items.map(item => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: (parseInt(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
        })),
      });

      setShowCreateModal(false);
      setFormData({
        clientId: '',
        clientName: '',
        clientEmail: '',
        dueDate: '',
        notes: '',
      });
      setItems([{ description: 'Portrait Session / Shooting Fee', quantity: 1, unit_price: '500' }]);
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
                      <button
                        title="Download PDF"
                        onClick={() => window.open(`/invoice/${inv.id}/print`, '_blank')}
                        style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', padding: 4 }}
                      >
                        PDF
                      </button>
                      <button
                        title="Send via Email"
                        disabled={sendingEmailId === inv.id}
                        onClick={() => handleSendEmail(inv.id)}
                        style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: 4, opacity: sendingEmailId === inv.id ? 0.5 : 1 }}
                      >
                        {sendingEmailId === inv.id ? 'Sending...' : 'Email'}
                      </button>
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

      {/* Create Modal - Flexible Invoice Maker Split-screen */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            className="animate-scale-in"
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              width: '95%',
              maxWidth: 1150,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                Invoice Maker
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Split Screen Content */}
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
              
              {/* Left Column: Form and Line-Item Builder */}
              <div style={{ flex: '1 1 500px', padding: 24, borderRight: '1px solid var(--color-border)', boxSizing: 'border-box' }}>
                <form onSubmit={handleCreate}>
                  
                  {/* Client Linking */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                      Link to Existing Client (Optional)
                    </label>
                    <select
                      className="select-field"
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                    >
                      <option value="">-- Select Client --</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Client Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="John Doe"
                        value={formData.clientName}
                        onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Client Email *
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        required
                        placeholder="john@example.com"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData((p) => ({ ...p, clientEmail: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Due Date
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={formData.dueDate}
                        onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Total Invoice Amount ({currency})
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${currency} ${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)', backgroundColor: '#f9f9f9', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>

                  {/* Line Item Builder */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Line Items
                      </span>
                      <button
                        type="button"
                        onClick={addItem}
                        style={{ fontSize: 12, background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        + Add Item
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Item description / service"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            style={{ flex: 3, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13 }}
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            style={{ flex: 1, width: 60, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13 }}
                          />
                          <input
                            type="number"
                            placeholder="Unit Price"
                            min="0"
                            step="0.01"
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            style={{ flex: 1.5, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13 }}
                          />
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: items.length <= 1 ? '#ccc' : '#d93025',
                              cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                              fontSize: 16,
                              padding: '0 4px',
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                      Notes & Terms
                    </label>
                    <textarea
                      className="textarea-field"
                      placeholder="e.g. Please complete payment within 14 days. Thank you!"
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)', minHeight: 70 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#f1f3f4', border: '1px solid var(--color-border)', color: '#5f6368' }}
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-accent">
                      Save & Issue Invoice
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Column: High Fidelity Invoice Live Preview */}
              <div style={{ flex: '1 1 500px', padding: 24, backgroundColor: '#f8f9fa', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777' }}>
                    Live Preview (Branded Document)
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#e2e8f0', color: '#4a5568' }}>
                    Draft
                  </span>
                </div>

                {/* Branded Paper invoice preview sheet */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: 24,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  minHeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 20 }}>
                    <div>
                      {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: 36, marginBottom: 8, display: 'block' }} />}
                      <h4 style={{ fontSize: 16, margin: 0, fontWeight: 700, color: '#1a1a1a' }}>{studioName}</h4>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.4 }}>
                        {location && <div>{location}</div>}
                        {website && <div>{website}</div>}
                        {photographerPhone && <div>Phone: {photographerPhone}</div>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: '#4a5568' }}>INVOICE</h3>
                      <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}># INV-DRAFT</div>
                    </div>
                  </div>

                  {/* Invoice Meta Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 12 }}>
                    <div>
                      <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#777', fontWeight: 600, marginBottom: 4 }}>Billed To</div>
                      <div style={{ fontWeight: 600 }}>{formData.clientName || 'Client Name'}</div>
                      <div style={{ color: '#555' }}>{formData.clientEmail || 'client@email.com'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#777', fontWeight: 600, marginBottom: 4 }}>Details</div>
                      <div><strong>Date Issued:</strong> {new Date().toISOString().split('T')[0]}</div>
                      {formData.dueDate && <div><strong>Due Date:</strong> {formData.dueDate}</div>}
                      <div><strong>Status:</strong> SENT</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#555' }}>Description</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#555' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#555' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#555' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.unit_price) || 0;
                        const total = qty * price;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f3f4' }}>
                            <td style={{ padding: '8px', color: '#2d3748', fontWeight: 500 }}>{item.description || 'Description'}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#555' }}>{qty}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#555' }}>{price.toFixed(2)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>{total.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: '2px solid #ddd', background: '#fafafa' }}>
                        <td colSpan="3" style={{ padding: '8px', fontWeight: 700, fontSize: 13 }}>Total Due ({currency})</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>
                          {calculatedTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Notes / Terms */}
                  {formData.notes && (
                    <div style={{ background: '#faf9f6', padding: 12, borderRadius: 4, borderLeft: '3px solid #ccc', fontSize: 11, marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, color: '#555', marginBottom: 2 }}>Notes / Terms</div>
                      <div style={{ color: '#444', lineHeight: 1.4 }}>{formData.notes}</div>
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 12 }}>
                    If you have any questions, contact {studioName}. Thank you!
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

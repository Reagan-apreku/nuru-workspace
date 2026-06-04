import { useState } from 'react';
import { useReceipts, useCreateReceipt, useDeleteReceipt, useClients, useInvoices, useUpdateInvoiceStatus, useSendReceiptEmail } from '../hooks/useApi';
import { useStudioProfile } from '../hooks/useStudioProfile';
import { useUser } from '@clerk/react';

export default function ReceiptsTab() {
  const { data: receipts, isLoading, error } = useReceipts();
  const { data: clients } = useClients();
  const { data: invoices } = useInvoices();
  const createReceipt = useCreateReceipt();
  const deleteReceipt = useDeleteReceipt();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const sendReceiptEmail = useSendReceiptEmail();

  const { studioName, location, website, logoUrl } = useStudioProfile();
  const { user } = useUser();

  const photographerEmail = user?.primaryEmailAddress?.emailAddress;
  const photographerPhone = user?.primaryPhoneNumber?.phoneNumber;

  const [sendingEmailId, setSendingEmailId] = useState(null);

  const handleSendEmail = async (id) => {
    try {
      setSendingEmailId(id);
      await sendReceiptEmail.mutateAsync(id);
      alert('Payment receipt email sent successfully to the client!');
    } catch (err) {
      console.error(err);
      alert('Failed to send email. Make sure your RESEND_API_KEY is configured.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    clientName: '',
    clientEmail: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState([
    { description: 'Photography Services / Custom Package', quantity: 1, unit_price: '500' }
  ]);

  const currency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'GHS';

  const handleInvoiceChange = (invoiceId) => {
    if (!invoiceId) {
      setFormData((prev) => ({
        ...prev,
        invoiceId: '',
        clientName: '',
        clientEmail: '',
      }));
      setItems([{ description: 'Photography Services / Custom Package', quantity: 1, unit_price: '500' }]);
      return;
    }

    const selectedInv = invoices?.find((i) => i.id === invoiceId);
    if (selectedInv) {
      setFormData((prev) => ({
        ...prev,
        invoiceId,
        clientName: selectedInv.client_name,
        clientEmail: selectedInv.client_email,
        notes: `Payment for Invoice ${selectedInv.invoice_number}`,
      }));
      
      if (selectedInv.items && Array.isArray(selectedInv.items) && selectedInv.items.length > 0) {
        setItems(selectedInv.items.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: String(item.unit_price || item.amount || 0)
        })));
      } else {
        setItems([{ description: `Payment for Invoice ${selectedInv.invoice_number}`, quantity: 1, unit_price: String(selectedInv.amount) }]);
      }
    }
  };

  const handleClientChange = (clientName) => {
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

    // Auto-generate receipt number based on receipts count
    const count = receipts ? receipts.length + 1 : 1;
    const recNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    try {
      await createReceipt.mutateAsync({
        receipt_number: recNumber,
        invoice_id: formData.invoiceId || null,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        amount: calculatedTotal,
        payment_method: formData.paymentMethod,
        payment_date: formData.paymentDate,
        notes: formData.notes,
        items: items.map(item => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: (parseInt(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
        })),
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
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([{ description: 'Photography Services / Custom Package', quantity: 1, unit_price: '500' }]);
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
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        title="Download PDF"
                        onClick={() => window.open(`/receipt/${rec.id}/print`, '_blank')}
                        style={{ background: 'none', border: 'none', color: '#2f855a', cursor: 'pointer', padding: 4 }}
                      >
                        PDF
                      </button>
                      <button
                        title="Send via Email"
                        disabled={sendingEmailId === rec.id}
                        onClick={() => handleSendEmail(rec.id)}
                        style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: 4, opacity: sendingEmailId === rec.id ? 0.5 : 1 }}
                      >
                        {sendingEmailId === rec.id ? 'Sending...' : 'Email'}
                      </button>
                      <button
                        title="Delete Receipt"
                        onClick={() => handleDelete(rec.id, rec.receipt_number)}
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

      {/* Create Modal - Flexible Receipt Maker Split-screen */}
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
                Receipt Maker
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
              
              {/* Left Column: Form and Item Builder */}
              <div style={{ flex: '1 1 500px', padding: 24, borderRight: '1px solid var(--color-border)', boxSizing: 'border-box' }}>
                <form onSubmit={handleCreate}>
                  
                  {/* Pay Unpaid Invoice */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                      Pay Unpaid Invoice (Optional)
                    </label>
                    <select
                      className="select-field"
                      value={formData.invoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                    >
                      <option value="">-- Choose Invoice --</option>
                      {unpaidInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} ({inv.client_name} - {currency} {inv.amount})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Client Select / Input */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                      Client Name *
                    </label>
                    <select
                      className="select-field"
                      disabled={!!formData.invoiceId}
                      value={formData.clientName}
                      onChange={(e) => handleClientChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)', marginBottom: 8 }}
                    >
                      <option value="">-- Select Client or Choose custom below --</option>
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
                        required
                        placeholder="Or type custom name"
                        value={formData.clientName}
                        onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                      Client Email *
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      required
                      disabled={!!formData.invoiceId}
                      placeholder="john@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData((p) => ({ ...p, clientEmail: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Payment Method
                      </label>
                      <select
                        className="select-field"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Card">Card</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Payment Date
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        required
                        value={formData.paymentDate}
                        onChange={(e) => setFormData((p) => ({ ...p, paymentDate: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Amount Paid ({currency})
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
                        disabled={!!formData.invoiceId}
                        onClick={addItem}
                        style={{ fontSize: 12, background: 'none', border: 'none', color: formData.invoiceId ? '#ccc' : '#1a73e8', cursor: formData.invoiceId ? 'not-allowed' : 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        + Add Item
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Item description"
                            required
                            disabled={!!formData.invoiceId}
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            style={{ flex: 3, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13 }}
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            required
                            disabled={!!formData.invoiceId}
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
                            disabled={!!formData.invoiceId}
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            style={{ flex: 1.5, padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: 13 }}
                          />
                          <button
                            type="button"
                            disabled={items.length <= 1 || !!formData.invoiceId}
                            onClick={() => removeItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: (items.length <= 1 || !!formData.invoiceId) ? '#ccc' : '#d93025',
                              cursor: (items.length <= 1 || !!formData.invoiceId) ? 'not-allowed' : 'pointer',
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
                      Notes / Reference
                    </label>
                    <textarea
                      className="textarea-field"
                      placeholder="e.g. Bank transfer confirmation ref #498273"
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
                    <button type="submit" className="btn btn-accent" style={{ backgroundColor: '#2f855a' }}>
                      Save & Issue Receipt
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Column: High Fidelity Receipt Live Preview */}
              <div style={{ flex: '1 1 500px', padding: 24, backgroundColor: '#f0fff4', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2f855a' }}>
                    Live Preview (Branded Document)
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#c6f6d5', color: '#2f855a', fontWeight: 'bold' }}>
                    Receipt
                  </span>
                </div>

                {/* Branded Paper receipt preview sheet */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #c6f6d5',
                  borderRadius: 6,
                  padding: 24,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  minHeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2f855a', paddingBottom: 16, marginBottom: 20 }}>
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
                      <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: '#2f855a' }}>RECEIPT</h3>
                      <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}># REC-DRAFT</div>
                    </div>
                  </div>

                  {/* Receipt Meta Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 12 }}>
                    <div>
                      <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#777', fontWeight: 600, marginBottom: 4 }}>Received From</div>
                      <div style={{ fontWeight: 600 }}>{formData.clientName || 'Client Name'}</div>
                      <div style={{ color: '#555' }}>{formData.clientEmail || 'client@email.com'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#777', fontWeight: 600, marginBottom: 4 }}>Payment Details</div>
                      <div><strong>Payment Date:</strong> {formData.paymentDate}</div>
                      <div><strong>Method:</strong> {formData.paymentMethod}</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f0fff4', borderBottom: '1px solid #c6f6d5' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#2f855a' }}>Description</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#2f855a' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#2f855a' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#2f855a' }}>Total Paid</th>
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
                      <tr style={{ borderTop: '2px solid #2f855a', background: '#f0fff4' }}>
                        <td colSpan="3" style={{ padding: '8px', fontWeight: 700, fontSize: 13, color: '#2f855a' }}>Total Paid ({currency})</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#2f855a' }}>
                          {calculatedTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Notes / Reference */}
                  {formData.notes && (
                    <div style={{ background: '#faf9f6', padding: 12, borderRadius: 4, borderLeft: '3px solid #2f855a', fontSize: 11, marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, color: '#2f855a', marginBottom: 2 }}>Payment Notes / Reference</div>
                      <div style={{ color: '#444', lineHeight: 1.4 }}>{formData.notes}</div>
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 12 }}>
                    Payment received and confirmed. Thank you for your business!
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

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');
const { getAuth } = require('@clerk/express');

// GET /api/invoices
router.get('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('photographer_id', photographerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices
router.post('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;
    const { invoice_number, client_id, client_name, client_email, amount, status, issue_date, due_date, notes } = req.body;

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number,
        client_id: client_id || null,
        client_name,
        client_email,
        amount: parseFloat(amount),
        status: status || 'sent',
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        due_date: due_date || null,
        notes: notes || null,
        photographer_id: photographerId,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/invoices/:id
router.put('/:id', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;
    const { status, amount, due_date, notes } = req.body;

    // Fetch original invoice to check ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.photographer_id !== photographerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: status !== undefined ? status : invoice.status,
        amount: amount !== undefined ? parseFloat(amount) : invoice.amount,
        due_date: due_date !== undefined ? due_date : invoice.due_date,
        notes: notes !== undefined ? notes : invoice.notes,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If status changed to 'paid', auto-generate a receipt if one doesn't exist yet
    if (status === 'paid' && invoice.status !== 'paid') {
      // Check if receipt already exists for this invoice
      const { data: existingReceipt } = await supabase
        .from('receipts')
        .select('id')
        .eq('invoice_id', req.params.id);

      if (!existingReceipt || existingReceipt.length === 0) {
        // Construct receipt number, e.g. REC-0001
        const numberPart = invoice.invoice_number.replace(/^\D+/g, '');
        const receiptNumber = 'REC-' + (numberPart || Math.floor(Math.random() * 10000));
        
        await supabase
          .from('receipts')
          .insert({
            receipt_number: receiptNumber,
            invoice_id: invoice.id,
            client_name: invoice.client_name,
            client_email: invoice.client_email,
            amount: invoice.amount,
            payment_method: 'Bank Transfer', // Default
            payment_date: new Date().toISOString().split('T')[0],
            photographer_id: photographerId,
            notes: `Auto-generated from paid Invoice ${invoice.invoice_number}`,
          });
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('photographer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.photographer_id !== photographerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

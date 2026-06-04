const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');
const { getAuth } = require('@clerk/express');

// GET /api/receipts
router.get('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('photographer_id', photographerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/receipts
router.post('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;
    const { receipt_number, invoice_id, client_name, client_email, amount, payment_method, payment_date, notes } = req.body;

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        receipt_number,
        invoice_id: invoice_id || null,
        client_name,
        client_email,
        amount: parseFloat(amount),
        payment_method: payment_method || 'Cash',
        payment_date: payment_date || new Date().toISOString().split('T')[0],
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

// DELETE /api/receipts/:id
router.delete('/:id', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('photographer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.photographer_id !== photographerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

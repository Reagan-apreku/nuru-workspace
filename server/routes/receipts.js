const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');
const { getAuth } = require('@clerk/express');
const resend = require('../lib/resendClient');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'studio@yourdomain.com';

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

// POST /api/receipts/:id/send-email
router.post('/:id/send-email', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.photographer_id !== photographerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: profile } = await supabase
      .from('photographers')
      .select('studio_name')
      .eq('clerk_user_id', photographerId)
      .single();

    const studioName = profile?.studio_name || 'Nuru Workspace';

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      return res.status(400).json({
        error: 'Resend API key is not configured. Please configure it in the .env file.',
      });
    }

    const currency = process.env.VITE_PAYSTACK_CURRENCY || 'GHS';
    const formattedAmount = `${currency} ${parseFloat(receipt.amount).toFixed(2)}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf9f6; color: #1a1a1a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2f855a; padding-bottom: 20px; margin-bottom: 30px; }
    .studio-title { font-size: 24px; font-weight: 300; letter-spacing: 0.05em; color: #2d3748; }
    .receipt-title { font-size: 20px; font-weight: 600; color: #2f855a; text-align: right; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
    .label { color: #718096; font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { color: #2d3748; font-weight: 600; }
    .table-container { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #f0fff4; color: #2f855a; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #c6f6d5; }
    td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
    .total-row { font-size: 16px; font-weight: 700; color: #2f855a; background: #f0fff4; }
    .notes-box { font-size: 13px; color: #4a5568; background: #faf9f6; padding: 16px; border-radius: 6px; border-left: 3px solid #cbd5e0; margin-bottom: 30px; }
    .footer { text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="studio-title">${studioName}</div>
      </div>
      <div>
        <div class="receipt-title">RECEIPT OF PAYMENT</div>
        <div style="font-size: 13px; color: #718096; text-align: right; margin-top: 4px;"># ${receipt.receipt_number}</div>
      </div>
    </div>
    
    <div class="meta-grid">
      <div>
        <div class="label">Received From</div>
        <div class="value">${receipt.client_name}</div>
        <div style="color: #4a5568;">${receipt.client_email}</div>
      </div>
      <div style="text-align: right;">
        <div class="label">Payment Date</div>
        <div class="value">${receipt.payment_date}</div>
        <div class="label" style="margin-top: 10px;">Payment Method</div>
        <div class="value">${receipt.payment_method || 'N/A'}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Payment for photography services / invoice reconciliation</td>
            <td style="text-align: right; font-weight: 600;">${formattedAmount}</td>
          </tr>
          <tr class="total-row">
            <td>Total Paid</td>
            <td style="text-align: right;">${formattedAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    \${receipt.notes ? \`
    <div class="notes-box">
      <div class="label" style="margin-bottom: 4px;">Payment Notes</div>
      <div>\${receipt.notes}</div>
    </div>
    \` : ''}

    <div class="footer">
      Payment confirmed. Thank you for your business!
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: `${studioName} <${fromEmail}>`,
      to: [receipt.client_email],
      subject: `Payment Receipt ${receipt.receipt_number} from ${studioName}`,
      html: emailHtml,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

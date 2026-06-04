const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');
const { getAuth, createClerkClient } = require('@clerk/express');
const resend = require('../lib/resendClient');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'studio@yourdomain.com';

const clerkClient = createClerkClient({ apiKey: process.env.CLERK_SECRET_KEY });

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
    const { invoice_number, client_id, client_name, client_email, amount, status, issue_date, due_date, notes, items } = req.body;

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
        items: items || [],
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
    const { status, amount, due_date, notes, items } = req.body;

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
        items: items !== undefined ? items : invoice.items,
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
            items: items || invoice.items || [],
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

// POST /api/invoices/:id/send-email
router.post('/:id/send-email', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const photographerId = auth.userId;

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

    let studioName = 'Nuru Workspace';
    let studioLocation = '';
    let studioWebsite = '';
    let studioLogo = '';
    let photographerEmail = '';
    let photographerPhone = '';
    let photographerName = '';

    try {
      const clerkUser = await clerkClient.users.getUser(photographerId);
      const meta = clerkUser.unsafeMetadata || {};
      studioName = meta.studioName || 'My Studio';
      studioLocation = meta.location || '';
      studioWebsite = meta.website || '';
      studioLogo = meta.logoUrl || '';
      photographerEmail = clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '';
      photographerPhone = clerkUser.phoneNumbers?.find(p => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber || '';
      photographerName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || studioName;
    } catch (e) {
      console.error('Failed to fetch clerk user metadata:', e);
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      return res.status(400).json({
        error: 'Resend API key is not configured. Please configure it in the .env file.',
      });
    }

    const currency = process.env.VITE_PAYSTACK_CURRENCY || 'GHS';
    const formattedAmount = `${currency} ${parseFloat(invoice.amount).toFixed(2)}`;

    let itemsHtml = '';
    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        const itemAmount = `${currency} ${parseFloat(item.amount || (item.quantity * item.unit_price) || 0).toFixed(2)}`;
        itemsHtml += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px;">
              <div style="font-weight: 600; color: #2d3748;">${item.description}</div>
              ${item.quantity && item.unit_price ? `<div style="font-size: 12px; color: #718096; margin-top: 2px;">${item.quantity} units @ ${currency} ${parseFloat(item.unit_price).toFixed(2)} each</div>` : ''}
            </td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; font-weight: 600; color: #2d3748; vertical-align: top;">${itemAmount}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml = `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748;">Photography Services / Custom Package</td>
          <td style="text-align: right; padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; font-weight: 600; color: #2d3748;">${formattedAmount}</td>
        </tr>
      `;
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf9f6; color: #1a1a1a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #edf2f7; padding-bottom: 20px; margin-bottom: 30px; display: table; width: 100%; }
    .header-col-left { display: table-cell; vertical-align: top; }
    .header-col-right { display: table-cell; text-align: right; vertical-align: top; }
    .studio-title { font-size: 24px; font-weight: 600; color: #2d3748; margin: 0; }
    .studio-info { font-size: 12px; color: #718096; margin-top: 4px; line-height: 1.4; }
    .invoice-title { font-size: 20px; font-weight: 600; color: #4a5568; margin: 0; }
    .meta-grid { display: table; width: 100%; margin-bottom: 30px; }
    .meta-col { display: table-cell; width: 50%; vertical-align: top; }
    .label { color: #718096; font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { color: #2d3748; font-weight: 600; font-size: 14px; }
    .table-container { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #f7fafc; color: #4a5568; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #edf2f7; }
    .total-row { font-size: 16px; font-weight: 700; color: #1a1a1a; background: #f7fafc; }
    .notes-box { font-size: 13px; color: #4a5568; background: #faf9f6; padding: 16px; border-radius: 6px; border-left: 3px solid #cbd5e0; margin-bottom: 30px; }
    .footer { text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-col-left">
        ${studioLogo ? `<img src="${studioLogo}" alt="${studioName}" style="max-height: 50px; margin-bottom: 8px; display: block;" />` : ''}
        <div class="studio-title">${studioName}</div>
        <div class="studio-info">
          ${studioLocation ? `<div>${studioLocation}</div>` : ''}
          ${studioWebsite ? `<div>${studioWebsite}</div>` : ''}
          ${photographerPhone ? `<div>Phone: ${photographerPhone}</div>` : ''}
        </div>
      </div>
      <div class="header-col-right">
        <div class="invoice-title">INVOICE</div>
        <div style="font-size: 14px; color: #718096; margin-top: 4px;"># ${invoice.invoice_number}</div>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-col">
        <div class="label">Billed To</div>
        <div class="value">${invoice.client_name}</div>
        <div style="color: #4a5568; font-size: 13px; margin-top: 2px;">${invoice.client_email}</div>
      </div>
      <div class="meta-col" style="text-align: right;">
        <div class="label">Date Issued</div>
        <div class="value">${invoice.issue_date}</div>
        ${invoice.due_date ? `<div class="label" style="margin-top: 12px;">Due Date</div><div class="value">${invoice.due_date}</div>` : ''}
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td style="padding: 12px; font-weight: 700;">Total Due</td>
            <td style="text-align: right; padding: 12px; font-weight: 700;">${formattedAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${invoice.notes ? `
    <div class="notes-box">
      <div class="label" style="margin-bottom: 4px;">Notes / Payment Terms</div>
      <div>${invoice.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      Thank you for your business! If you have any questions, please contact ${studioName} directly${photographerEmail ? ` at ${photographerEmail}` : ''}.
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: `${studioName} <${fromEmail}>`,
      to: [invoice.client_email],
      subject: `Invoice ${invoice.invoice_number} from ${studioName}`,
      html: emailHtml,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

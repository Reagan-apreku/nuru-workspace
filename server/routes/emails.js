const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const resend = require('../lib/resendClient');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');

const fromEmail = process.env.RESEND_FROM_EMAIL || 'studio@yourdomain.com';

/**
 * Generate a clean HTML email template
 */
function buildEmailHtml(subject, body, options = {}) {
  const studioName = options.studioName || 'Nuru Workspace';
  const emailHeader = options.emailHeader || studioName;
  const emailFooter = options.emailFooter || `You received this email because you are a client of ${studioName}.<br />If you believe this was sent in error, please disregard.`;
  const brandColor = options.brandColor || '#1a1a1a';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a1a;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      padding: 60px 24px;
    }
    .studio-name {
      font-size: 24px;
      font-weight: 300;
      letter-spacing: 0.1em;
      color: ${brandColor};
      margin-bottom: 40px;
      text-transform: uppercase;
      border-bottom: 1px solid ${brandColor}22;
      padding-bottom: 16px;
    }
    .subject-line {
      font-size: 20px;
      font-weight: 400;
      margin-bottom: 24px;
      color: #1a1a1a;
    }
    .body-text {
      font-size: 16px;
      line-height: 1.8;
      color: #333;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #e8e5e0;
      font-size: 12px;
      color: #aaa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="studio-name">${emailHeader}</div>
    <div class="subject-line">${subject}</div>
    <div class="body-text">${body.replace(/\n/g, '<br>')}</div>
    <div class="footer">
      ${emailFooter.replace(/\n/g, '<br>')}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Replace placeholders like {{client_name}}, {{studio_name}}, etc. in a template string
 */
function replacePlaceholders(templateStr, variables = {}) {
  if (!templateStr) return '';
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

// POST /api/emails/send — send email via Resend (auth required)
router.post('/send', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const { 
      subject, 
      body, 
      recipient_type, 
      studio_name, 
      email_header, 
      email_footer, 
      email_greeting, 
      brand_color,
      photographer_name,
      studio_tagline,
      studio_location,
      studio_website
    } = req.body;
    const sentBy = req.auth?.userId;

    // Validation
    const errors = {};
    if (!subject || !subject.trim()) errors.subject = 'Subject is required';
    if (!body || !body.trim()) errors.body = 'Email body is required';
    if (!recipient_type) errors.recipient_type = 'Recipient is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      return res.status(400).json({
        error: 'Resend API key is not configured. Please add a valid RESEND_API_KEY to your .env file.',
      });
    }

    let recipients = [];

    if (recipient_type === 'all') {
      // Fetch all client emails
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('first_name, last_name, email')
        .not('email', 'is', null);

      if (fetchError) throw fetchError;

      // Filter to unique emails
      const uniqueClients = [];
      const seen = new Set();
      for (const client of clients) {
        if (!seen.has(client.email)) {
          seen.add(client.email);
          uniqueClients.push(client);
        }
      }

      recipients = uniqueClients.map((c) => c.email);

      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No clients to send to' });
      }

      // Send batch via Resend
      const batchPayload = uniqueClients.map((client) => {
        const clientName = client.first_name || 'there';
        const clientLastName = client.last_name || '';
        const clientFullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'there';

        const vars = {
          client_name: clientName,
          client_last_name: clientLastName,
          client_full_name: clientFullName,
          studio_name: studio_name || 'Nuru Workspace',
          studio_tagline: studio_tagline || '',
          studio_location: studio_location || '',
          studio_website: studio_website || '',
          photographer_name: photographer_name || '',
        };

        const greetingTemplate = email_greeting || 'Hello {{client_name}},';
        const greeting = replacePlaceholders(greetingTemplate, vars) + '\n\n';
        const personalizedBody = greeting + replacePlaceholders(body, vars);
        const personalizedSubject = replacePlaceholders(subject, vars);
        const personalizedHeader = replacePlaceholders(email_header || studio_name, vars);
        const personalizedFooter = replacePlaceholders(email_footer, vars);

        const clientHtml = buildEmailHtml(personalizedSubject, personalizedBody, {
          studioName: studio_name,
          emailHeader: personalizedHeader,
          emailFooter: personalizedFooter,
          brandColor: brand_color,
        });

        return {
          from: fromEmail,
          to: client.email,
          subject: personalizedSubject,
          html: clientHtml,
        };
      });

      const response = await resend.batch.send(batchPayload);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to send batch email via Resend');
      }
    } else {
      // Single recipient
      recipients = [recipient_type];

      const { data: client } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('email', recipient_type)
        .limit(1)
        .maybeSingle();

      const clientName = client ? (client.first_name || 'there') : 'there';
      const clientLastName = client ? (client.last_name || '') : '';
      const clientFullName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'there';

      const vars = {
        client_name: clientName,
        client_last_name: clientLastName,
        client_full_name: clientFullName,
        studio_name: studio_name || 'Nuru Workspace',
        studio_tagline: studio_tagline || '',
        studio_location: studio_location || '',
        studio_website: studio_website || '',
        photographer_name: photographer_name || '',
      };

      const greetingTemplate = email_greeting || 'Hello {{client_name}},';
      const greeting = replacePlaceholders(greetingTemplate, vars) + '\n\n';
      const personalizedBody = greeting + replacePlaceholders(body, vars);
      const personalizedSubject = replacePlaceholders(subject, vars);
      const personalizedHeader = replacePlaceholders(email_header || studio_name, vars);
      const personalizedFooter = replacePlaceholders(email_footer, vars);

      const clientHtml = buildEmailHtml(personalizedSubject, personalizedBody, {
        studioName: studio_name,
        emailHeader: personalizedHeader,
        emailFooter: personalizedFooter,
        brandColor: brand_color,
      });

      const response = await resend.emails.send({
        from: fromEmail,
        to: recipient_type,
        subject: personalizedSubject,
        html: clientHtml,
      });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to send email via Resend');
      }
    }

    // Log to Supabase
    const { data: logEntry, error: logError } = await supabase
      .from('emails_sent')
      .insert({
        subject: subject.trim(),
        body: body.trim(),
        recipient_type,
        sent_by: sentBy,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging email:', logError);
    }

    res.json({
      success: true,
      message: `Email sent to ${recipients.length} recipient(s)`,
      log: logEntry,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/emails/sent — get sent email history (auth required)
router.get('/sent', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('emails_sent')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

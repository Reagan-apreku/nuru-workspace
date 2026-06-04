const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { clerkClient } = require('@clerk/express');

// POST /api/payments/webhook — Paystack Webhook Listener
router.post('/webhook', async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_db41c09930f730c4e724a2ef69a19c6cfbb7a6e19c';
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      console.warn('Paystack Webhook: Missing signature header.');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      console.warn('Paystack Webhook: Signature verification failed.');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    console.log(`Paystack Webhook received event: ${payload.event}`);

    // Handle successful payment charge
    if (payload.event === 'charge.success') {
      const data = payload.data;
      const metadata = data.metadata || {};
      
      let userId = metadata.userId || metadata.user_id;
      let planKey = metadata.planKey || metadata.plan_key;

      // Fallback search in custom_fields if needed
      if (!userId && Array.isArray(metadata.custom_fields)) {
        const uField = metadata.custom_fields.find(f => f.variable_name === 'user_id');
        if (uField) userId = uField.value;
      }
      if (!planKey && Array.isArray(metadata.custom_fields)) {
        const pField = metadata.custom_fields.find(f => f.variable_name === 'plan_key');
        if (pField) planKey = pField.value;
      }

      if (!userId || !planKey) {
        console.warn('Paystack Webhook: Charge success but missing user_id or plan_key in metadata.', metadata);
        return res.status(200).json({ error: 'Missing required metadata fields' });
      }

      console.log(`Webhook Action: Upgrading user ${userId} to plan '${planKey}' (Ref: ${data.reference})`);

      try {
        const user = await clerkClient.users.getUser(userId);
        await clerkClient.users.updateUser(userId, {
          unsafeMetadata: {
            ...user.unsafeMetadata,
            plan: planKey,
            planStartDate: new Date().toISOString(),
            paymentReference: data.reference,
          }
        });
        console.log(`User ${userId} successfully upgraded to '${planKey}' via Webhook.`);
      } catch (clerkErr) {
        console.error('Webhook Action Error: Failed to update user metadata in Clerk:', clerkErr);
        return res.status(500).json({ error: 'Clerk metadata update failed' });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

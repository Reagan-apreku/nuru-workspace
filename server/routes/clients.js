const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');

const VALID_SHOOT_TYPES = [
  'Portrait',
  'Wedding',
  'Corporate/Headshot',
  'Product/Commercial',
  'Family',
  'Maternity',
  'Events',
  'Other',
];

// POST /api/clients — create new client (public, client-facing)
router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, shoot_type, notes, photographer_id } = req.body;

    // Validation
    const errors = {};
    if (!first_name || !first_name.trim()) errors.first_name = 'First name is required';
    if (!last_name || !last_name.trim()) errors.last_name = 'Last name is required';
    if (!email || !email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!shoot_type) errors.shoot_type = 'Shoot type is required';
    else if (!VALID_SHOOT_TYPES.includes(shoot_type)) errors.shoot_type = 'Invalid shoot type';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        shoot_type,
        notes: notes ? notes.trim() : null,
        photographer_id: photographer_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/clients — get all clients (auth required)
router.get('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        feedback (rating)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Compute average rating per client
    const clients = data.map((client) => {
      const ratings = client.feedback?.map((f) => f.rating).filter(Boolean) || [];
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : null;
      return {
        ...client,
        avg_rating: avgRating,
        feedback: undefined,
      };
    });

    res.json(clients);
  } catch (err) {
    next(err);
  }
});

// GET /api/clients/:id — get single client
router.get('/:id', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, feedback(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Client not found' });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

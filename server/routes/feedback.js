const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabaseAdmin');
const { clerkBase, requireClerkAuth } = require('../middleware/clerkAuth');

// POST /api/feedback — submit feedback (public, client-facing)
router.post('/', async (req, res, next) => {
  try {
    const { client_id, rating, comment } = req.body;

    const errors = {};
    if (!client_id) errors.client_id = 'Client ID is required';
    if (!rating || rating < 1 || rating > 5) errors.rating = 'Rating must be between 1 and 5';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        client_id,
        rating: parseInt(rating),
        comment: comment ? comment.trim() : null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback — get all feedback (auth required)
router.get('/', clerkBase, requireClerkAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        clients (first_name, last_name, shoot_type, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

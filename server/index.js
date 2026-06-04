const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const clientsRouter = require('./routes/clients');
const feedbackRouter = require('./routes/feedback');
const emailsRouter = require('./routes/emails');
const paymentsRouter = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl, `${clientUrl}/`],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/clients', clientsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

-- ============================================================
-- NURU WORKSPACE — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── CLIENTS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shoot_type TEXT NOT NULL CHECK (
    shoot_type IN (
      'Portrait',
      'Wedding',
      'Corporate/Headshot',
      'Product/Commercial',
      'Family',
      'Maternity',
      'Events',
      'Other'
    )
  ),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  photographer_id TEXT  -- Clerk user ID
);

-- ─── FEEDBACK TABLE ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  rating INT2 NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── EMAILS SENT TABLE ───────────────────────────────────

CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_type TEXT NOT NULL,  -- "all" or specific email
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_by TEXT  -- Clerk user ID
);

-- ─── PHOTOGRAPHERS TABLE (optional, for extended profiles) ─

CREATE TABLE IF NOT EXISTS photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  studio_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;

-- ─── SERVICE ROLE POLICIES (full access for backend) ──────

-- The backend uses the service_role key, which bypasses RLS.
-- These policies ensure no public/anon access is possible.

-- Clients: Allow insert for anon (client intake form), all ops for service role
CREATE POLICY "Allow public insert on clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role full access on clients"
  ON clients FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Feedback: Allow insert for anon (client feedback), all ops for service role
CREATE POLICY "Allow public insert on feedback"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role full access on feedback"
  ON feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Emails sent: Service role only
CREATE POLICY "Service role full access on emails_sent"
  ON emails_sent FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Photographers: Service role only
CREATE POLICY "Service role full access on photographers"
  ON photographers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── INDEXES ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_photographer_id ON clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_client_id ON feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_sent_at ON emails_sent(sent_at DESC);

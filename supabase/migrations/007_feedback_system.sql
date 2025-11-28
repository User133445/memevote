-- Feedback system table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'idea', 'improvement', 'other')),
  message TEXT NOT NULL,
  email TEXT,
  wallet_address TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'planned', 'in_progress', 'done', 'rejected')),
  admin_notes TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert feedback
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read feedback (for public roadmap)
CREATE POLICY "Anyone can read feedback" ON feedback
  FOR SELECT
  USING (true);

-- Policy: Only admins can update feedback
CREATE POLICY "Only admins can update feedback" ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.badge = 'Admin'
    )
  );

-- Upvotes table for feedback
CREATE TABLE IF NOT EXISTS feedback_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- wallet address
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_feedback_id ON feedback_upvotes(feedback_id);


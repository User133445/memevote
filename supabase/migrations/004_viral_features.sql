-- Migration 004: Social Graph + For You + Daily Quests + Tipping + Meme-to-Earn
-- This migration adds all Tier 1 features for viral growth

-- ============================================
-- 1. SOCIAL GRAPH (Follow System)
-- ============================================
-- Already exists in 002_advanced_features.sql, but let's ensure it's complete

-- ============================================
-- 2. FOR YOU PAGE (ELO Scoring + Collaborative Filtering)
-- ============================================

-- ELO scores for memes (for ranking)
CREATE TABLE IF NOT EXISTS meme_elo_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  elo_score DECIMAL(10, 2) DEFAULT 1500,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id)
);

-- User preferences for collaborative filtering
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_preferences JSONB DEFAULT '{}', -- { "AI": 0.8, "Politics": 0.3 }
  creator_preferences JSONB DEFAULT '{}', -- { "wallet1": 0.9, "wallet2": 0.7 }
  embedding_vector JSONB, -- Embedding stored as JSONB array (alternative to vector type)
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User-meme interactions (for collaborative filtering)
CREATE TABLE IF NOT EXISTS user_meme_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'vote', 'tip', 'share', 'comment')),
  interaction_value DECIMAL(5, 2) DEFAULT 1.0, -- Weight of interaction (vote = 2.0, tip = 5.0)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meme_id, interaction_type)
);

-- ============================================
-- 3. DAILY QUESTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_type TEXT NOT NULL CHECK (quest_type IN ('vote', 'upload', 'invite', 'streak', 'tip', 'share')),
  quest_name TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL, -- e.g., 10 votes, 3 invites
  reward_amount DECIMAL(18, 8) NOT NULL, -- $VOTE reward
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User quest progress
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT FALSE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id, quest_date)
);

-- ============================================
-- 4. TIPPING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  tipper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipper_wallet TEXT NOT NULL,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_wallet TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  solana_tx_signature TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. MEME-TO-EARN (Creator Fund)
-- ============================================

CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly')),
  period_start DATE NOT NULL,
  rank INTEGER, -- Top 10 = eligible
  reward_pool_share DECIMAL(5, 2) DEFAULT 0, -- 20% if top 10
  earnings_amount DECIMAL(18, 8) DEFAULT 0,
  paid_out BOOLEAN DEFAULT FALSE,
  solana_tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, meme_id, period_type, period_start)
);

-- ============================================
-- 6. DARK POOL VOTING
-- ============================================

CREATE TABLE IF NOT EXISTS dark_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  fee_paid DECIMAL(18, 8) NOT NULL DEFAULT 5, -- 5 $VOTE per dark vote
  revealed_at TIMESTAMPTZ, -- Revealed after 24h
  solana_tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, user_id)
);

-- ============================================
-- 7. MEME INSURANCE
-- ============================================

CREATE TABLE IF NOT EXISTS meme_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insurance_premium DECIMAL(18, 8) NOT NULL, -- 5% of potential rewards
  guaranteed_minimum DECIMAL(18, 8) NOT NULL, -- 50% of potential if flop
  viral_score_threshold DECIMAL(5, 2) DEFAULT 30, -- If < 30 = flop
  actual_rewards DECIMAL(18, 8) DEFAULT 0,
  insurance_paid BOOLEAN DEFAULT FALSE,
  solana_tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id)
);

-- ============================================
-- 8. ON-CHAIN REPUTATION
-- ============================================

-- Add reputation_score to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='reputation_score') THEN
    ALTER TABLE profiles ADD COLUMN reputation_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Reputation history (for transparency)
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_change INTEGER NOT NULL,
  reason TEXT NOT NULL, -- "meme_uploaded", "top_10_daily", "tip_received", etc.
  related_meme_id UUID REFERENCES memes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. DYNAMIC FEES
-- ============================================

CREATE TABLE IF NOT EXISTS fee_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('swap', 'staking', 'dark_vote', 'insurance')),
  base_fee DECIMAL(5, 2) NOT NULL, -- 0.5% to 2%
  current_fee DECIMAL(5, 2) NOT NULL,
  volume_24h DECIMAL(18, 8) DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meme_elo_scores ON meme_elo_scores(elo_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meme_interactions_user_id ON user_meme_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meme_interactions_meme_id ON user_meme_interactions(meme_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_date ON user_quest_progress(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_tips_meme_id ON tips(meme_id);
CREATE INDEX IF NOT EXISTS idx_tips_recipient_id ON tips(recipient_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_period ON creator_earnings(creator_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_dark_votes_meme_id ON dark_votes(meme_id);
CREATE INDEX IF NOT EXISTS idx_dark_votes_revealed_at ON dark_votes(revealed_at) WHERE revealed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_meme_insurance_meme_id ON meme_insurance(meme_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_score ON profiles(reputation_score DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  memes_count INTEGER;
  top_10_count INTEGER;
  tips_received DECIMAL;
  tips_given DECIMAL;
  streak_days INTEGER;
BEGIN
  -- Base score from memes uploaded
  SELECT COUNT(*) INTO memes_count FROM memes WHERE user_id = user_uuid;
  score := score + (memes_count * 10);
  
  -- Bonus for top 10 memes
  SELECT COUNT(*) INTO top_10_count 
  FROM creator_earnings 
  WHERE creator_id = user_uuid AND rank <= 10;
  score := score + (top_10_count * 100);
  
  -- Tips received (shows community appreciation)
  SELECT COALESCE(SUM(amount), 0) INTO tips_received 
  FROM tips 
  WHERE recipient_id = user_uuid AND status = 'confirmed';
  score := score + FLOOR(tips_received / 10);
  
  -- Tips given (shows engagement)
  SELECT COALESCE(SUM(amount), 0) INTO tips_given 
  FROM tips 
  WHERE tipper_id = user_uuid AND status = 'confirmed';
  score := score + FLOOR(tips_given / 20);
  
  -- Streak bonus
  SELECT streak_days INTO streak_days FROM profiles WHERE id = user_uuid;
  score := score + (streak_days * 5);
  
  -- Cap at 1000
  IF score > 1000 THEN
    score := 1000;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update reputation when events occur
CREATE OR REPLACE FUNCTION update_reputation_on_event()
RETURNS TRIGGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'memes' AND TG_OP = 'INSERT' THEN
    new_score := calculate_reputation_score(NEW.user_id);
    UPDATE profiles SET reputation_score = new_score WHERE id = NEW.user_id;
    INSERT INTO reputation_history (user_id, score_change, reason, related_meme_id)
    VALUES (NEW.user_id, 10, 'meme_uploaded', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputation updates
DROP TRIGGER IF EXISTS reputation_update_trigger ON memes;
CREATE TRIGGER reputation_update_trigger
AFTER INSERT ON memes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_event();

-- ============================================
-- INITIAL DATA: Daily Quests
-- ============================================

INSERT INTO daily_quests (quest_type, quest_name, description, target_value, reward_amount) VALUES
('vote', 'Vote 10 Times', 'Vote on 10 memes today', 10, 100),
('upload', 'Upload a Meme', 'Share your first meme', 1, 200),
('invite', 'Invite 3 Friends', 'Bring 3 friends to MemeVote', 3, 500),
('streak', '7 Day Streak', 'Login for 7 days in a row', 7, 1000),
('tip', 'Tip a Creator', 'Support a creator with a tip', 1, 50),
('share', 'Share 5 Memes', 'Share 5 memes on social media', 5, 150)
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE meme_elo_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meme_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_history ENABLE ROW LEVEL SECURITY;

-- Basic policies (users can read their own data, admins can read all)
CREATE POLICY "Users can read their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own quest progress" ON user_quest_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read all tips" ON tips
  FOR SELECT USING (true);

CREATE POLICY "Users can read reputation history" ON reputation_history
  FOR SELECT USING (true);

CREATE POLICY "Users can read fee history" ON fee_history
  FOR SELECT USING (true);


-- Migration 005: Badges & Achievements + Daily Spin (Halal Version)
-- Toutes les récompenses sont gratuites, pas de gambling

-- ============================================
-- 1. BADGES & ACHIEVEMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_key TEXT UNIQUE NOT NULL, -- 'bronze', 'silver', 'gold', 'diamond', 'king', 'viral', etc.
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- Emoji ou nom d'icône
  badge_rarity TEXT DEFAULT 'common' CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type TEXT NOT NULL, -- 'upload_count', 'vote_count', 'upvotes_received', 'leaderboard_rank', etc.
  requirement_value INTEGER NOT NULL,
  reward_amount DECIMAL(18, 8) DEFAULT 0, -- $VOTE reward when earned
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT TRUE, -- User can choose which badges to display
  UNIQUE(user_id, badge_id)
);

-- Badge progress tracking
CREATE TABLE IF NOT EXISTS badge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- 2. DAILY SPIN (HALAL VERSION)
-- ============================================
-- Pas de mise d'argent, uniquement des spins gratuits quotidiens

CREATE TABLE IF NOT EXISTS daily_spin_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('multiplier', 'bonus', 'badge', 'vip', 'lucky_streak')),
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  reward_value DECIMAL(18, 8) DEFAULT 0, -- Amount of $VOTE or multiplier value
  reward_duration INTEGER DEFAULT 0, -- Duration in hours (0 = permanent)
  probability DECIMAL(5, 2) DEFAULT 0, -- Probability percentage (0-100)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User daily spins
CREATE TABLE IF NOT EXISTS user_daily_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spins_used INTEGER DEFAULT 0,
  max_spins INTEGER DEFAULT 3, -- 3 spins gratuits par jour
  last_spin_at TIMESTAMPTZ,
  UNIQUE(user_id, spin_date)
);

-- Spin results
CREATE TABLE IF NOT EXISTS spin_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES daily_spin_rewards(id),
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(18, 8) DEFAULT 0,
  expires_at TIMESTAMPTZ, -- NULL if permanent
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MEME REACTIONS (Emoji Reactions)
-- ============================================

CREATE TABLE IF NOT EXISTS meme_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('funny', 'fire', 'dead', 'smart', 'shocked', 'diamond')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, user_id, reaction_type)
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_spins_user_date ON user_daily_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_spin_results_user_id ON spin_results(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_results_active ON spin_results(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_meme_reactions_meme_id ON meme_reactions(meme_id);
CREATE INDEX IF NOT EXISTS idx_meme_reactions_user_id ON meme_reactions(user_id);

-- ============================================
-- 5. INSERT DEFAULT BADGES
-- ============================================

INSERT INTO badges (badge_key, badge_name, badge_description, badge_icon, badge_rarity, requirement_type, requirement_value, reward_amount) VALUES
-- Common Badges
('bronze', 'Bronze Creator', 'Upload 10 memes', '🥉', 'common', 'upload_count', 10, 100),
('silver', 'Silver Voter', 'Give 100 votes', '🥈', 'common', 'vote_count', 100, 200),
('gold', 'Gold Memer', 'Receive 1000 upvotes', '🥇', 'common', 'upvotes_received', 1000, 500),
('diamond', 'Diamond Star', 'Reach top 10 in leaderboard', '💎', 'rare', 'leaderboard_rank', 10, 1000),
('king', 'Meme King', 'Get 10K followers', '👑', 'epic', 'followers_count', 10000, 5000),
('viral', 'Viral Master', 'Meme with 10K+ upvotes', '🔥', 'epic', 'meme_upvotes', 10000, 3000),
('sniper', 'Sniper', '100% win rate in battles', '🎯', 'rare', 'battle_win_rate', 100, 2000),
('whale', 'Whale', 'Stake 100K $VOTE', '🐋', 'rare', 'staked_amount', 100000, 5000),
('lucky', 'Lucky', 'Win 3x in daily spin', '🎲', 'rare', 'spin_wins', 3, 1000),
('speed_demon', 'Speed Demon', 'Upload 10 memes in 1 hour', '⚡', 'rare', 'upload_speed', 10, 1500),
('night_owl', 'Night Owl', 'Active between 2-5 AM', '🌙', 'common', 'night_activity', 1, 200),
('early_bird', 'Early Bird', 'First to vote on 10 memes', '🌅', 'common', 'early_votes', 10, 300),
('meme_master', 'Meme Master', 'Create #1 meme of the day', '🎪', 'legendary', 'daily_rank', 1, 10000)
ON CONFLICT (badge_key) DO NOTHING;

-- ============================================
-- 6. INSERT DEFAULT DAILY SPIN REWARDS (HALAL)
-- ============================================

INSERT INTO daily_spin_rewards (reward_type, reward_name, reward_description, reward_value, reward_duration, probability) VALUES
-- Common rewards (60% probability)
('multiplier', 'Vote Multiplier x2', 'Double your vote power for 1 hour', 2.0, 1, 25.0),
('bonus', 'Small Bonus', 'Get 100 $VOTE', 100, 0, 20.0),
('bonus', 'Medium Bonus', 'Get 500 $VOTE', 500, 0, 10.0),
('badge', 'Lucky Badge', 'Earn the Lucky badge', 0, 0, 5.0),

-- Rare rewards (30% probability)
('multiplier', 'Vote Multiplier x3', 'Triple your vote power for 2 hours', 3.0, 2, 8.0),
('bonus', 'Big Bonus', 'Get 1000 $VOTE', 1000, 0, 7.0),
('vip', 'VIP Access', '24 hours of VIP access', 0, 24, 5.0),
('lucky_streak', 'Lucky Streak', '+50% gains for 2 hours', 1.5, 2, 10.0),

-- Epic rewards (10% probability)
('multiplier', 'Vote Multiplier x5', '5x your vote power for 3 hours', 5.0, 3, 3.0),
('bonus', 'Huge Bonus', 'Get 5000 $VOTE', 5000, 0, 2.0),
('vip', 'VIP Access Week', '7 days of VIP access', 0, 168, 1.0)
ON CONFLICT DO NOTHING;


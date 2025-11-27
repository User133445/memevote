-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badge TEXT DEFAULT 'Bronze',
  streak_days INTEGER DEFAULT 0,
  last_streak_date DATE,
  total_earnings DECIMAL(18, 8) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memes table
CREATE TABLE IF NOT EXISTS memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'gif', 'video')),
  file_size BIGINT,
  score INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  nft_minted BOOLEAN DEFAULT FALSE,
  nft_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- wallet address
  type INTEGER NOT NULL CHECK (type IN (1, -1)), -- 1 = upvote, -1 = downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, user_id)
);

-- Leaderboard table (for daily/weekly/global rankings)
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'global')),
  period_start DATE NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  reward_amount DECIMAL(18, 8),
  reward_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, period_type, period_start)
);

-- Staking table
CREATE TABLE IF NOT EXISTS staking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Chad', 'Diamond', 'Whale')),
  locked_until TIMESTAMPTZ,
  apr DECIMAL(5, 2) NOT NULL,
  total_rewards DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  total_earnings DECIMAL(18, 8) DEFAULT 0,
  paid_out DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Premium subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme1_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  meme2_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  pot_amount DECIMAL(18, 8) DEFAULT 0,
  winner_id UUID REFERENCES memes(id),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle votes table
CREATE TABLE IF NOT EXISTS battle_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  stake_amount DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes(user_id);
CREATE INDEX IF NOT EXISTS idx_memes_score ON memes(score DESC);
CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memes_category ON memes(category);
CREATE INDEX IF NOT EXISTS idx_votes_meme_id ON votes(meme_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period_type, period_start, rank);
CREATE INDEX IF NOT EXISTS idx_staking_user_id ON staking(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Function to update user points
CREATE OR REPLACE FUNCTION increment_user_points(user_wallet TEXT, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql;

-- Function to update meme score
CREATE OR REPLACE FUNCTION update_meme_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memes
  SET score = (
    SELECT COALESCE(SUM(type), 0)
    FROM votes
    WHERE votes.meme_id = NEW.meme_id
  )
  WHERE id = NEW.meme_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update meme score on vote
DROP TRIGGER IF EXISTS update_meme_score_trigger ON votes;
CREATE TRIGGER update_meme_score_trigger
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_meme_score();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Memes policies
CREATE POLICY "Memes are viewable by everyone"
  ON memes FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own memes"
  ON memes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Leaderboard policies
CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard FOR SELECT
  USING (true);

-- Staking policies
CREATE POLICY "Staking is viewable by everyone"
  ON staking FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own staking"
  ON staking FOR INSERT
  WITH CHECK (true);

-- Referrals policies
CREATE POLICY "Referrals are viewable by referrer"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);


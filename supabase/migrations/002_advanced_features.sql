-- Advanced features migration

-- Collaborative memes table
CREATE TABLE IF NOT EXISTS collaborative_memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, collaborator_id)
);

-- Trending memes cache table
CREATE TABLE IF NOT EXISTS trending_memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  trending_type TEXT NOT NULL CHECK (trending_type IN ('hot_now', 'rising_stars')),
  viral_score DECIMAL(5, 2) DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(meme_id, trending_type)
);

-- Bridge transactions table (Wormhole)
CREATE TABLE IF NOT EXISTS bridge_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  target_chain TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token_symbol TEXT NOT NULL,
  wormhole_tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile boosts table
CREATE TABLE IF NOT EXISTS profile_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('feed', 'profile', 'trending')),
  duration_days INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vote fraud detection table
CREATE TABLE IF NOT EXISTS vote_fraud_detection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  meme_id UUID REFERENCES memes(id) ON DELETE CASCADE,
  fraud_score DECIMAL(5, 2) DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-app wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer')),
  token_symbol TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  solana_tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collaborative_memes_meme_id ON collaborative_memes(meme_id);
CREATE INDEX IF NOT EXISTS idx_trending_memes_type ON trending_memes(trending_type, viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_user ON bridge_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profile_boosts_user ON profile_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_vote_fraud_user ON vote_fraud_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Add viral_score column to memes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='memes' AND column_name='viral_score') THEN
    ALTER TABLE memes ADD COLUMN viral_score DECIMAL(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Add is_collaborative column to memes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='memes' AND column_name='is_collaborative') THEN
    ALTER TABLE memes ADD COLUMN is_collaborative BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add followers_count and following_count to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='followers_count') THEN
    ALTER TABLE profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='following_count') THEN
    ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON followers;
CREATE TRIGGER update_follower_counts_trigger
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- RLS Policies
ALTER TABLE collaborative_memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Collaborative memes policies
DROP POLICY IF EXISTS "Collaborative memes are viewable by everyone" ON collaborative_memes;
CREATE POLICY "Collaborative memes are viewable by everyone"
  ON collaborative_memes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own collaborative memes" ON collaborative_memes;
CREATE POLICY "Users can manage own collaborative memes"
  ON collaborative_memes FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM memes WHERE id = meme_id) OR auth.uid() = collaborator_id);

-- Trending memes policies
DROP POLICY IF EXISTS "Trending memes are viewable by everyone" ON trending_memes;
CREATE POLICY "Trending memes are viewable by everyone"
  ON trending_memes FOR SELECT
  USING (true);

-- Bridge transactions policies
DROP POLICY IF EXISTS "Users can view own bridge transactions" ON bridge_transactions;
CREATE POLICY "Users can view own bridge transactions"
  ON bridge_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bridge transactions" ON bridge_transactions;
CREATE POLICY "Users can insert own bridge transactions"
  ON bridge_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Followers policies
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON followers;
CREATE POLICY "Followers are viewable by everyone"
  ON followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON followers;
CREATE POLICY "Users can manage own follows"
  ON followers FOR ALL
  USING (auth.uid() = follower_id);

-- Direct messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
CREATE POLICY "Users can view own messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Wallet transactions policies
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can insert own wallet transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements policies
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);


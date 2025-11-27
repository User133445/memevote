-- First connection bonus migration

-- Add wallet_name and first_connection_bonus_claimed to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_name TEXT,
ADD COLUMN IF NOT EXISTS first_connection_bonus_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wallet_badge_url TEXT;

-- Add wallet_badges table for wallet logos
CREATE TABLE IF NOT EXISTS wallet_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_name TEXT UNIQUE NOT NULL,
  badge_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert wallet badges
INSERT INTO wallet_badges (wallet_name, badge_url) VALUES
  ('Phantom', '/wallets/phantom.svg'),
  ('Backpack', '/wallets/backpack.svg'),
  ('Solflare', '/wallets/solflare.svg'),
  ('Coinbase Wallet', '/wallets/coinbase.svg'),
  ('OKX', '/wallets/okx.svg'),
  ('Trust Wallet', '/wallets/trust.svg'),
  ('Ledger', '/wallets/ledger.svg')
ON CONFLICT (wallet_name) DO NOTHING;

-- Function to claim first connection bonus
CREATE OR REPLACE FUNCTION claim_first_connection_bonus(user_wallet TEXT, wallet_name TEXT)
RETURNS JSON AS $$
DECLARE
  profile_record RECORD;
  bonus_claimed BOOLEAN;
  bonus_votes INTEGER := 50;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM profiles
  WHERE wallet_address = user_wallet;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check if bonus already claimed
  IF profile_record.first_connection_bonus_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Bonus already claimed');
  END IF;

  -- Update profile with bonus
  UPDATE profiles
  SET 
    points = points + bonus_votes,
    wallet_name = wallet_name,
    first_connection_bonus_claimed = TRUE,
    wallet_badge_url = (SELECT badge_url FROM wallet_badges WHERE wallet_badges.wallet_name = claim_first_connection_bonus.wallet_name),
    updated_at = NOW()
  WHERE wallet_address = user_wallet;

  -- Add achievement
  INSERT INTO achievements (user_id, achievement_type, achievement_name)
  VALUES (
    profile_record.id,
    'first_connection',
    'First Connection Bonus'
  )
  ON CONFLICT (user_id, achievement_type) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'bonus_votes', bonus_votes,
    'wallet_name', wallet_name
  );
END;
$$ LANGUAGE plpgsql;


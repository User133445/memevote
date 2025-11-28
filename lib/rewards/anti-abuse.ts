/**
 * Anti-Abuse Checks for Rewards Distribution
 */

export interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
  fraudScore: number;
  flags: string[];
}

export interface MemeEligibilityData {
  memeId: string;
  userId: string;
  walletAddress: string;
  memeCreatedAt: string;
  memeScore: number;
  memeViews: number;
  userVotes: number;
  accountAge: number; // days
  ipAddress?: string;
  deviceFingerprint?: string;
}

/**
 * Check if meme is eligible for rewards (anti-abuse)
 */
export function checkMemeEligibility(data: MemeEligibilityData): AbuseCheckResult {
  const flags: string[] = [];
  let fraudScore = 0;

  // 1. Minimum account age (7 days)
  if (data.accountAge < 7) {
    fraudScore += 20;
    flags.push(`Compte trop récent (${data.accountAge} jours, minimum 7)`);
  }

  // 2. Minimum meme age (24 hours)
  const memeAge = Date.now() - new Date(data.memeCreatedAt).getTime();
  const memeAgeHours = memeAge / (1000 * 60 * 60);
  if (memeAgeHours < 24) {
    fraudScore += 15;
    flags.push(`Meme trop récent (${Math.round(memeAgeHours)}h, minimum 24h)`);
  }

  // 3. Minimum views (100 views)
  if (data.memeViews < 100) {
    fraudScore += 10;
    flags.push(`Pas assez de vues (${data.memeViews}, minimum 100)`);
  }

  // 4. Minimum score (50 points)
  if (data.memeScore < 50) {
    fraudScore += 10;
    flags.push(`Score trop bas (${data.memeScore}, minimum 50)`);
  }

  // 5. Suspicious vote pattern (user voted too many times on their own meme)
  // If user has more than 20% of total votes on their own meme, it's suspicious
  if (data.userVotes > data.memeScore * 0.2) {
    fraudScore += 25;
    flags.push("Pattern de vote suspect (trop de votes sur son propre meme)");
  }

  // 6. Score-to-views ratio (suspicious if too high)
  const engagementRate = data.memeViews > 0 ? data.memeScore / data.memeViews : 0;
  if (engagementRate > 0.5) {
    // More than 50% of viewers voted (suspicious)
    fraudScore += 15;
    flags.push("Taux d'engagement suspect (trop élevé)");
  }

  // Determine if allowed
  const allowed = fraudScore < 50; // Threshold: 50 points

  return {
    allowed,
    reason: allowed ? undefined : flags.join("; "),
    fraudScore,
    flags,
  };
}

/**
 * Check for multi-account abuse
 */
export async function checkMultiAccountAbuse(
  walletAddress: string,
  ipAddress?: string,
  deviceFingerprint?: string
): Promise<{
  isAbuse: boolean;
  reason?: string;
  relatedAccounts: number;
}> {
  // This would typically query the database
  // For now, return a placeholder structure
  
  // In production, check:
  // - Same IP with multiple wallets
  // - Same device fingerprint with multiple wallets
  // - Same wallet with multiple user accounts
  
  return {
    isAbuse: false,
    relatedAccounts: 0,
  };
}

/**
 * Calculate minimum requirements for reward eligibility
 */
export function getMinimumRequirements() {
  return {
    accountAgeDays: 7,
    memeAgeHours: 24,
    minViews: 100,
    minScore: 50,
    maxEngagementRate: 0.5, // 50%
    maxSelfVoteRatio: 0.2, // 20%
  };
}


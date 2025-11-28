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

  // Vérifications simplifiées - plus de barrières d'âge pour faciliter l'onboarding
  // On garde seulement les protections essentielles contre les bots

  // 1. Minimum views (réduit à 50 pour être plus accessible)
  if (data.memeViews < 50) {
    fraudScore += 10;
    flags.push(`Pas assez de vues (${data.memeViews}, minimum 50)`);
  }

  // 2. Minimum score (réduit à 30 pour encourager la participation)
  if (data.memeScore < 30) {
    fraudScore += 10;
    flags.push(`Score trop bas (${data.memeScore}, minimum 30)`);
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
    accountAgeDays: 0, // Pas de barrière d'âge pour faciliter l'onboarding
    memeAgeHours: 0, // Pas de barrière d'âge pour les memes
    minViews: 50, // Réduit de 100 à 50
    minScore: 30, // Réduit de 50 à 30
    maxEngagementRate: 0.5, // 50%
    maxSelfVoteRatio: 0.2, // 20% - GARDE cette protection importante
  };
}


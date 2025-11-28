/**
 * Vote Limits Logic
 * Calculates how many votes a user can cast based on their staking tier
 */

export interface StakingTier {
  name: "Chad" | "Diamond" | "Whale";
  minAmount: number;
  votesPerDay: number; // -1 for unlimited
  feedBoost: number;
  apr: number;
}

export const STAKING_TIERS: StakingTier[] = [
  {
    name: "Chad",
    minAmount: 1000,
    votesPerDay: 50,
    feedBoost: 20,
    apr: 5,
  },
  {
    name: "Diamond",
    minAmount: 10000,
    votesPerDay: 500,
    feedBoost: 50,
    apr: 10,
  },
  {
    name: "Whale",
    minAmount: 100000,
    votesPerDay: -1, // unlimited
    feedBoost: 100,
    apr: 15,
  },
];

/**
 * Get user's staking tier
 */
export function getStakingTier(stakedAmount: number): StakingTier | null {
  // Sort tiers by minAmount descending to check highest tier first
  const sortedTiers = [...STAKING_TIERS].sort((a, b) => b.minAmount - a.minAmount);
  
  for (const tier of sortedTiers) {
    if (stakedAmount >= tier.minAmount) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Calculate votes remaining for today
 */
export function calculateVotesRemaining(
  votesToday: number,
  stakingTier: StakingTier | null
): {
  remaining: number;
  limit: number;
  unlimited: boolean;
} {
  // Free users get 10 votes per day
  const freeVotesPerDay = 10;
  
  if (!stakingTier) {
    return {
      remaining: Math.max(0, freeVotesPerDay - votesToday),
      limit: freeVotesPerDay,
      unlimited: false,
    };
  }

  // Unlimited votes for Whale tier
  if (stakingTier.votesPerDay === -1) {
    return {
      remaining: -1, // -1 means unlimited
      limit: -1,
      unlimited: true,
    };
  }

  return {
    remaining: Math.max(0, stakingTier.votesPerDay - votesToday),
    limit: stakingTier.votesPerDay,
    unlimited: false,
  };
}

/**
 * Check if user can vote
 */
export function canUserVote(
  votesToday: number,
  stakingTier: StakingTier | null
): boolean {
  const { remaining, unlimited } = calculateVotesRemaining(votesToday, stakingTier);
  return unlimited || remaining > 0;
}

/**
 * Get vote cooldown in minutes
 * Free users: 5 minutes between votes
 * Staked users: 1 minute between votes
 */
export function getVoteCooldownMinutes(stakingTier: StakingTier | null): number {
  return stakingTier ? 1 : 5;
}


/**
 * Vote Utilities
 * Helper functions for vote operations
 */

import { createClient } from "@/lib/supabase/client";
import { getStakingTier, calculateVotesRemaining, canUserVote, getVoteCooldownMinutes } from "./vote-limits";

export interface VoteCheckResult {
  canVote: boolean;
  reason?: string;
  votesRemaining: number;
  votesLimit: number;
  unlimited: boolean;
  cooldownMinutes: number;
}

/**
 * Check if user can vote (with staking tier consideration)
 */
export async function checkVoteEligibility(
  userId: string,
  memeId: string
): Promise<VoteCheckResult> {
  const supabase = createClient();
  if (!supabase) {
    return {
      canVote: false,
      reason: "Supabase non configuré",
      votesRemaining: 0,
      votesLimit: 0,
      unlimited: false,
      cooldownMinutes: 5,
    };
  }

  // Get user's staking info
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return {
      canVote: false,
      reason: "Utilisateur non connecté",
      votesRemaining: 0,
      votesLimit: 0,
      unlimited: false,
      cooldownMinutes: 5,
    };
  }

  // Get staking data
  const { data: staking } = await supabase
    .from("staking")
    .select("amount, tier")
    .eq("user_id", userId)
    .single();

  const stakedAmount = staking?.amount ? parseFloat(staking.amount.toString()) : 0;
  const stakingTier = getStakingTier(stakedAmount);

  // Count votes today (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  
  const { data: votesToday, error: votesError } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  if (votesError) {
    console.error("Error counting votes:", votesError);
  }

  const voteCount = votesToday?.length || 0;
  const { remaining, limit, unlimited } = calculateVotesRemaining(voteCount, stakingTier);

  // Check if already voted on this meme
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id, created_at")
    .eq("meme_id", memeId)
    .eq("user_id", userId)
    .single();

  // Check cooldown
  const cooldownMinutes = getVoteCooldownMinutes(stakingTier);
  let canVoteNow = true;
  let reason: string | undefined;

  if (existingVote) {
    const lastVoteTime = new Date(existingVote.created_at).getTime();
    const timeSinceLastVote = Date.now() - lastVoteTime;
    const cooldownMs = cooldownMinutes * 60 * 1000;

    if (timeSinceLastVote < cooldownMs) {
      canVoteNow = false;
      const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastVote) / 1000 / 60);
      reason = `Attendez ${remainingCooldown} minute(s) avant de revoter`;
    }
  } else {
    // New vote - check if user has votes remaining
    if (!unlimited && remaining <= 0) {
      canVoteNow = false;
      reason = `Vous avez atteint votre limite de ${limit} votes/jour. Stakez pour plus de votes !`;
    }
  }

  return {
    canVote: canVoteNow && (unlimited || remaining > 0),
    reason,
    votesRemaining: unlimited ? -1 : remaining,
    votesLimit: unlimited ? -1 : limit,
    unlimited,
    cooldownMinutes,
  };
}

/**
 * Get user's vote statistics
 */
export async function getUserVoteStats(userId: string): Promise<{
  votesToday: number;
  votesLimit: number;
  votesRemaining: number;
  unlimited: boolean;
  stakingTier: string | null;
  stakedAmount: number;
}> {
  const supabase = createClient();
  if (!supabase) {
    return {
      votesToday: 0,
      votesLimit: 10,
      votesRemaining: 10,
      unlimited: false,
      stakingTier: null,
      stakedAmount: 0,
    };
  }

  // Get staking data
  const { data: staking } = await supabase
    .from("staking")
    .select("amount, tier")
    .eq("user_id", userId)
    .single();

  const stakedAmount = staking?.amount ? parseFloat(staking.amount.toString()) : 0;
  const stakingTier = staking?.tier || null;

  // Count votes today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  
  const { data: votesToday } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  const voteCount = votesToday?.length || 0;

  // Calculate limit
  let votesLimit = 10; // Free tier
  let unlimited = false;

  if (stakingTier === "Whale") {
    unlimited = true;
    votesLimit = -1;
  } else if (stakingTier === "Diamond") {
    votesLimit = 500;
  } else if (stakingTier === "Chad") {
    votesLimit = 50;
  }

  // Calculate remaining votes
  const votesRemaining = unlimited ? -1 : Math.max(0, votesLimit - voteCount);

  return {
    votesToday: voteCount,
    votesLimit,
    votesRemaining,
    unlimited,
    stakingTier,
    stakedAmount,
  };
}


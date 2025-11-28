// Edge Function pour distribuer les récompenses quotidiennes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current date (UTC) - extract only date part (YYYY-MM-DD)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayDate = today.toISOString().split('T')[0] // Extract date part: "YYYY-MM-DD"

    // Get daily leaderboard for today
    // Use the base leaderboard table with period_type filter
    const { data: leaderboard, error: leaderboardError } = await supabaseClient
      .from('leaderboard')
      .select(`
        *,
        memes!inner(
          user_id,
          profiles(wallet_address)
        )
      `)
      .eq('period_type', 'daily')
      .eq('period_start', todayDate) // Compare DATE with DATE string (YYYY-MM-DD)
      .order('score', { ascending: false })
      .limit(50)

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      throw leaderboardError
    }

    if (!leaderboard || leaderboard.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No leaderboard data for today yet',
          rewards: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate rewards distribution with anti-abuse checks
    // Top 1 = 1500 USDC, Top 2-10 = 500 USDC, Top 11-50 = 100 USDC
    const rewards = []
    
    for (let index = 0; index < leaderboard.length && index < 50; index++) {
      const entry = leaderboard[index]
      let amount = 0
      if (index === 0) {
        amount = 1500 // Top 1
      } else if (index < 10) {
        amount = 500 // Top 2-10
      } else if (index < 50) {
        amount = 100 // Top 11-50
      }

      // Extract user_id and wallet_address from nested structure
      const meme = entry.memes as any
      const profile = meme?.profiles as any
      const user_id = meme?.user_id
      const wallet_address = profile?.wallet_address

      if (!user_id || !wallet_address) {
        console.warn(`Skipping entry ${index + 1}: missing user_id or wallet_address`)
        continue
      }

      // Anti-abuse checks
      // Get meme details
      const { data: memeData } = await supabaseClient
        .from('memes')
        .select('created_at, views, score, user_id')
        .eq('id', entry.meme_id)
        .single()

      if (!memeData) {
        console.warn(`Skipping entry ${index + 1}: meme not found`)
        continue
      }

      // Get user account age
      const { data: userProfile } = await supabaseClient
        .from('profiles')
        .select('created_at')
        .eq('id', user_id)
        .single()

      const accountAge = userProfile 
        ? (Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0

      // Get user's votes on this meme
      const { data: userVotes } = await supabaseClient
        .from('votes')
        .select('id')
        .eq('meme_id', entry.meme_id)
        .eq('user_id', user_id)

      const userVoteCount = userVotes?.length || 0

      // Check eligibility
      const memeAge = Date.now() - new Date(memeData.created_at).getTime()
      const memeAgeHours = memeAge / (1000 * 60 * 60)

      // Minimum requirements
      const minAccountAge = 7 // days
      const minMemeAge = 24 // hours
      const minViews = 100
      const minScore = 50

      // Check if eligible
      let isEligible = true
      const reasons: string[] = []

      if (accountAge < minAccountAge) {
        isEligible = false
        reasons.push(`Compte trop récent (${Math.round(accountAge)} jours)`)
      }

      if (memeAgeHours < minMemeAge) {
        isEligible = false
        reasons.push(`Meme trop récent (${Math.round(memeAgeHours)}h)`)
      }

      if (memeData.views < minViews) {
        isEligible = false
        reasons.push(`Pas assez de vues (${memeData.views})`)
      }

      if (memeData.score < minScore) {
        isEligible = false
        reasons.push(`Score trop bas (${memeData.score})`)
      }

      // Check self-vote ratio (suspicious if > 20%)
      const selfVoteRatio = memeData.score > 0 ? userVoteCount / memeData.score : 0
      if (selfVoteRatio > 0.2) {
        isEligible = false
        reasons.push(`Trop de votes sur son propre meme (${Math.round(selfVoteRatio * 100)}%)`)
      }

      if (!isEligible) {
        console.warn(`Skipping reward for rank ${index + 1}: ${reasons.join(', ')}`)
        continue
      }

      rewards.push({
        user_id,
        wallet_address,
        amount,
        rank: index + 1,
        score: entry.score,
      })
    }

    // Log rewards for debugging
    console.log(`Distributing rewards to ${rewards.length} users`)
    console.log('Rewards breakdown:', rewards)

    // TODO: Implement actual Solana transfer
    // For now, we'll store the rewards in the database
    // In production, you would:
    // 1. Connect to Solana RPC
    // 2. Transfer USDC or $VOTE tokens to each wallet
    // 3. Record the transaction hash

    // Store reward records
    const rewardRecords = rewards.map((reward: any) => ({
      user_id: reward.user_id,
      wallet_address: reward.wallet_address,
      amount: reward.amount,
      rank: reward.rank,
      date: todayDate,
      status: 'pending', // Will be updated to 'completed' after transfer
      token_type: 'USDC', // or 'VOTE'
    }))

    const { error: insertError } = await supabaseClient
      .from('daily_rewards')
      .insert(rewardRecords)

    if (insertError) {
      console.error('Error inserting reward records:', insertError)
      // Don't throw, just log - rewards will be processed later
    }

    // Update user total earnings
    for (const reward of rewards) {
      const { error: updateError } = await supabaseClient.rpc('increment_user_earnings', {
        user_uuid: reward.user_id,
        amount: reward.amount
      })

      if (updateError) {
        console.error(`Error updating earnings for user ${reward.user_id}:`, updateError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Distributed rewards to ${rewards.length} users`,
        rewards: rewards.map((r: any) => ({
          rank: r.rank,
          wallet: r.wallet_address,
          amount: r.amount
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error in distribute-rewards function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.toString() : String(error)
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
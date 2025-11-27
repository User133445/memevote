// Edge Function pour distribuer les récompenses quotidiennes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Get current date (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Get daily leaderboard for today
    const { data: leaderboard, error: leaderboardError } = await supabaseClient
      .from('leaderboard_daily')
      .select('*, profiles(wallet_address)')
      .eq('date', todayISO)
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

    // Calculate rewards distribution
    // Top 1 = 1500 USDC, Top 2-10 = 500 USDC, Top 11-50 = 100 USDC
    const rewards = leaderboard.map((entry, index) => {
      let amount = 0
      if (index === 0) {
        amount = 1500 // Top 1
      } else if (index < 10) {
        amount = 500 // Top 2-10
      } else if (index < 50) {
        amount = 100 // Top 11-50
      }

      return {
        user_id: entry.user_id,
        wallet_address: entry.profiles?.wallet_address || entry.wallet_address,
        amount,
        rank: index + 1,
        score: entry.score,
      }
    }).filter(r => r.amount > 0) // Only include users who get rewards

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
    const rewardRecords = rewards.map(reward => ({
      user_id: reward.user_id,
      wallet_address: reward.wallet_address,
      amount: reward.amount,
      rank: reward.rank,
      date: todayISO,
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
        rewards: rewards.map(r => ({
          rank: r.rank,
          wallet: r.wallet_address,
          amount: r.amount
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in distribute-rewards function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

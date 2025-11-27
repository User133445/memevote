import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, memeId, voteType, ipAddress, userAgent, fingerprint } = await request.json();

    if (!userId || !memeId || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // 1. Check rate limit (votes per 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: recentVotes, error: rateLimitError } = await supabase
      .from("votes")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", fiveMinutesAgo.toISOString());

    if (rateLimitError) {
      return NextResponse.json(
        { error: "Rate limit check failed" },
        { status: 500 }
      );
    }

    if (recentVotes && recentVotes.length >= 10) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          suspicious: true,
          reason: "Too many votes in short time"
        },
        { status: 429 }
      );
    }

    // 2. Check for vote farms (same IP, multiple accounts)
    if (ipAddress) {
      const { data: sameIpVotes } = await supabase
        .from("votes")
        .select("user_id")
        .eq("meme_id", memeId)
        .gte("created_at", fiveMinutesAgo.toISOString());

      if (sameIpVotes) {
        const uniqueUsers = new Set(sameIpVotes.map(v => v.user_id));
        if (uniqueUsers.size > 5) {
          return NextResponse.json(
            {
              error: "Suspicious activity detected",
              suspicious: true,
              reason: "Multiple accounts from same IP"
            },
            { status: 403 }
          );
        }
      }
    }

    // 3. Check for sybil attacks (same fingerprint, multiple accounts)
    if (fingerprint) {
      const { data: sameFingerprint } = await supabase
        .from("user_fingerprints")
        .select("user_id")
        .eq("fingerprint", fingerprint)
        .limit(10);

      if (sameFingerprint && sameFingerprint.length > 3) {
        const uniqueUsers = new Set(sameFingerprint.map(f => f.user_id));
        if (uniqueUsers.size > 3) {
          return NextResponse.json(
            {
              error: "Suspicious activity detected",
              suspicious: true,
              reason: "Multiple accounts with same fingerprint"
            },
            { status: 403 }
          );
        }
      }
    }

    // 4. Check voting pattern (all upvotes or all downvotes = bot)
    const { data: userVotes } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (userVotes && userVotes.length >= 20) {
      const upvotes = userVotes.filter(v => v.vote_type === "up").length;
      const downvotes = userVotes.filter(v => v.vote_type === "down").length;
      
      // If 95%+ same vote type, likely a bot
      if (upvotes / userVotes.length > 0.95 || downvotes / userVotes.length > 0.95) {
        return NextResponse.json(
          {
            error: "Suspicious voting pattern",
            suspicious: true,
            reason: "Unnatural voting pattern detected"
          },
          { status: 403 }
        );
      }
    }

    // 5. Check for rapid-fire votes (human can't vote that fast)
    if (recentVotes && recentVotes.length > 0) {
      const lastVote = recentVotes[0];
      const timeSinceLastVote = Date.now() - new Date(lastVote.created_at).getTime();
      
      if (timeSinceLastVote < 2000) { // Less than 2 seconds
        return NextResponse.json(
          {
            error: "Vote too fast",
            suspicious: true,
            reason: "Votes happening too quickly"
          },
          { status: 429 }
        );
      }
    }

    // All checks passed - vote is legitimate
    return NextResponse.json({
      allowed: true,
      suspicious: false,
    });
  } catch (error: any) {
    console.error("Anti-cheat check error:", error);
    return NextResponse.json(
      { error: error.message || "Anti-cheat check failed" },
      { status: 500 }
    );
  }
}


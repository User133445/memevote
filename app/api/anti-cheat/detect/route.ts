import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, memeId } = await request.json();

    if (!userId || !memeId) {
      return NextResponse.json(
        { error: "Missing userId or memeId" },
        { status: 400 }
      );
    }

    // Fetch user's recent votes
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (votesError) throw votesError;

    // Simple fraud detection algorithm
    const voteCount = votes?.length || 0;
    const upvoteCount = votes?.filter((v: any) => v.type === 1).length || 0;
    const downvoteCount = votes?.filter((v: any) => v.type === -1).length || 0;

    // Check for suspicious patterns
    let fraudScore = 0;
    const reasons: string[] = [];

    // Too many votes in short time
    if (voteCount > 100) {
      fraudScore += 30;
      reasons.push("Trop de votes en 24h");
    }

    // Only upvotes (potential bot)
    if (upvoteCount > 50 && downvoteCount === 0) {
      fraudScore += 25;
      reasons.push("Seulement des upvotes");
    }

    // Check vote timing (suspiciously fast)
    if (votes && votes.length > 1) {
      const timeDiffs = votes
        .map((v, i) => {
          if (i === 0) return 0;
          return (
            new Date(v.created_at).getTime() -
            new Date(votes[i - 1].created_at).getTime()
          );
        })
        .filter((diff) => diff > 0);

      const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      if (avgTimeDiff < 1000) {
        // Less than 1 second between votes
        fraudScore += 20;
        reasons.push("Votes trop rapides");
      }
    }

    // Check if user has been flagged before
    const { data: previousFlags } = await supabase
      .from("vote_fraud_detection")
      .select("*")
      .eq("user_id", userId)
      .eq("flagged", true)
      .limit(1);

    if (previousFlags && previousFlags.length > 0) {
      fraudScore += 15;
      reasons.push("Utilisateur déjà signalé");
    }

    const flagged = fraudScore >= 50;

    // Record detection
    await supabase.from("vote_fraud_detection").insert({
      user_id: userId,
      meme_id: memeId,
      fraud_score: fraudScore,
      flagged,
      reason: reasons.join(", "),
    });

    return NextResponse.json({
      fraudScore,
      flagged,
      reasons,
    });
  } catch (error: any) {
    console.error("Anti-cheat detection error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Fetch recent memes with votes and views
    const { data: memes, error } = await supabase
      .from("memes")
      .select("id, score, views, created_at, votes(type)")
      .eq("status", "approved")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("score", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculate viral scores using AI
    const viralScores = await Promise.all(
      memes.map(async (meme) => {
        const votes = meme.votes || [];
        const upvotes = votes.filter((v: any) => v.type === 1).length;
        const downvotes = votes.filter((v: any) => v.type === -1).length;
        const timeSinceCreation = Date.now() - new Date(meme.created_at).getTime();
        const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);

        // Simple scoring algorithm (can be enhanced with OpenAI)
        const engagementRate = meme.views > 0 ? (upvotes / meme.views) * 100 : 0;
        const velocity = upvotes / Math.max(hoursSinceCreation, 1);
        const viralScore = (engagementRate * 0.4 + velocity * 0.6) * 100;

        return {
          meme_id: meme.id,
          viral_score: Math.min(viralScore, 100),
        };
      })
    );

    // Separate into hot_now and rising_stars
    const sorted = viralScores.sort((a, b) => b.viral_score - a.viral_score);
    const hotNow = sorted.slice(0, 20);
    const risingStars = sorted
      .filter((m: any) => {
        const meme = memes.find((mm: any) => mm.id === m.meme_id);
        const hoursSinceCreation = (Date.now() - new Date(meme!.created_at).getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation < 24 && m.viral_score > 50; // Rising if less than 24h old and score > 50
      })
      .slice(0, 20);

    // Update trending_memes table
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

    // Clear old entries
    await supabase
      .from("trending_memes")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Insert hot_now
    if (hotNow.length > 0) {
      await supabase.from("trending_memes").insert(
        hotNow.map((item: any) => ({
          meme_id: item.meme_id,
          trending_type: "hot_now",
          viral_score: item.viral_score,
          expires_at: expiresAt.toISOString(),
        }))
      );
    }

    // Insert rising_stars
    if (risingStars.length > 0) {
      await supabase.from("trending_memes").insert(
        risingStars.map((item: any) => ({
          meme_id: item.meme_id,
          trending_type: "rising_stars",
          viral_score: item.viral_score,
          expires_at: expiresAt.toISOString(),
        }))
      );
    }

    return NextResponse.json({
      success: true,
      hot_now: hotNow.length,
      rising_stars: risingStars.length,
    });
  } catch (error: any) {
    console.error("Error calculating trending:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


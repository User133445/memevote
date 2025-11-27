"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { useInView } from "react-intersection-observer";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// ELO-based ranking algorithm
async function calculateELOScore(memeId: string, won: boolean, opponentElo: number) {
  const supabase = createClient();
  if (!supabase) return;

  const K = 32; // ELO K-factor
  
  // Get current ELO
  const { data: current } = await supabase
    .from("meme_elo_scores")
    .select("elo_score, matches_played, wins, losses")
    .eq("meme_id", memeId)
    .single();

  const currentElo = current?.elo_score || 1500;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
  const actualScore = won ? 1 : 0;
  const newElo = currentElo + K * (actualScore - expectedScore);

  // Update ELO
  await supabase
    .from("meme_elo_scores")
    .upsert({
      meme_id: memeId,
      elo_score: newElo,
      matches_played: (current?.matches_played || 0) + 1,
      wins: won ? (current?.wins || 0) + 1 : (current?.wins || 0),
      losses: !won ? (current?.losses || 0) + 1 : (current?.losses || 0),
      last_updated: new Date().toISOString(),
    });
}

// Collaborative filtering: Find similar users
async function findSimilarUsers(userId: string, limit: number = 10) {
  const supabase = createClient();
  if (!supabase) return [];

  // Get user's interaction patterns
  const { data: userInteractions } = await supabase
    .from("user_meme_interactions")
    .select("meme_id, interaction_type, interaction_value")
    .eq("user_id", userId)
    .limit(100);

  if (!userInteractions || userInteractions.length === 0) return [];

  // Find users who interacted with similar memes
  const memeIds = userInteractions.map((i: any) => i.meme_id);
  const { data: similarUsers } = await supabase
    .from("user_meme_interactions")
    .select("user_id")
    .in("meme_id", memeIds)
    .neq("user_id", userId);

  if (!similarUsers) return [];

  // Count overlaps (simple collaborative filtering)
  const userOverlaps: Record<string, number> = {};
  similarUsers.forEach((su: any) => {
    userOverlaps[su.user_id] = (userOverlaps[su.user_id] || 0) + 1;
  });

  return Object.entries(userOverlaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => userId);
}

// Get personalized feed using collaborative filtering + ELO
async function getPersonalizedFeed(userId: string, page: number = 0) {
  const supabase = createClient();
  if (!supabase) return [];

  // Find similar users
  const similarUserIds = await findSimilarUsers(userId, 5);
  
  // Get memes liked by similar users (collaborative filtering)
  let query = supabase
    .from("memes")
    .select(`
      *,
      profiles:user_id(username, avatar_url),
      user_meme_interactions!inner(user_id, interaction_type)
    `)
    .eq("status", "approved")
    .in("user_meme_interactions.user_id", similarUserIds.length > 0 ? similarUserIds : [userId])
    .eq("user_meme_interactions.interaction_type", "vote")
    .order("created_at", { ascending: false })
    .range(page * 10, (page + 1) * 10 - 1);

  const { data: collaborativeMemes } = await query;

  // Get high score memes (score-based ranking)
  const { data: eloMemes } = await supabase
    .from("memes")
    .select(`
      *,
      profiles:user_id(username, avatar_url)
    `)
    .eq("status", "approved")
    .order("score", { ascending: false })
    .range(page * 5, (page + 1) * 5 - 1);

  // Merge and deduplicate
  const allMemes = [...(collaborativeMemes || []), ...(eloMemes || [])];
  const uniqueMemes = Array.from(
    new Map(allMemes.map(m => [m.id, m])).values()
  );

  // Sort by score or recency
  return uniqueMemes.sort((a, b) => {
    const aScore = a.score || 0;
    const bScore = b.score || 0;
    if (Math.abs(aScore - bScore) > 10) {
      return bScore - aScore; // Higher score first
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function ForYouPage() {
  const { publicKey, connected } = useWallet();
  const supabase = createClient();
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchPersonalizedFeed();
    } else {
      // Fallback to trending if not connected
      fetchTrendingFeed();
    }
  }, [connected, publicKey, page]);

  const fetchPersonalizedFeed = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        fetchTrendingFeed();
        return;
      }

      const personalizedMemes = await getPersonalizedFeed(user.user.id, page);
      
      if (personalizedMemes && personalizedMemes.length > 0) {
        setMemes((prev) => {
          const newMemes = personalizedMemes.filter(m => !prev.some(p => p.id === m.id));
          return [...prev, ...newMemes];
        });
        setHasMore(personalizedMemes.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      fetchTrendingFeed();
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingFeed = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("score", { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemes((prev) => {
          const newMemes = data.filter((m: any) => !prev.some((p: any) => p.id === m.id));
          return [...prev, ...newMemes];
        });
        setHasMore(data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching trending feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
    }
  }, [inView, hasMore, loading]);

  if (loading && memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">Crafting your perfect feed... ✨</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            For You
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {connected 
              ? "Personalized memes just for you based on your taste" 
              : "Connect wallet for personalized feed"}
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 text-xs text-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span>AI-Powered</span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {memes.map((meme) => (
          <div key={meme.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MemeCard meme={meme} />
          </div>
        ))}
      </div>

      {/* Infinite Scroll */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      )}

      {!hasMore && memes.length > 0 && (
        <div className="text-center py-12">
          <div className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm text-muted-foreground">
            ✨ You&apos;ve seen all personalized memes!
          </div>
        </div>
      )}

      {!hasMore && memes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No memes found</p>
          {!connected && (
            <p className="text-sm text-muted-foreground">
              Connect your wallet to get personalized recommendations
            </p>
          )}
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { VirtualizedFeed } from "@/components/feed/virtualized-feed";
import { useInView } from "react-intersection-observer";
import { Loader2, Sparkles, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdBanner } from "@/components/ads/ad-banner";
import { DailySpinWheel } from "@/components/daily-spin/daily-spin-wheel";
import { usePremium } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";
import { FloatingActionButton } from "@/components/floating-action-button";

// ELO-based ranking algorithm (from foryou page)
async function calculateELOScore(memeId: string, won: boolean, opponentElo: number) {
  const supabase = createClient();
  if (!supabase) return;

  const K = 32;
  const { data: current } = await supabase
    .from("meme_elo_scores")
    .select("elo_score, matches_played, wins, losses")
    .eq("meme_id", memeId)
    .single();

  const currentElo = current?.elo_score || 1500;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
  const actualScore = won ? 1 : 0;
  const newElo = currentElo + K * (actualScore - expectedScore);

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

  const { data: userInteractions } = await supabase
    .from("user_meme_interactions")
    .select("meme_id, interaction_type, interaction_value")
    .eq("user_id", userId)
    .limit(100);

  if (!userInteractions || userInteractions.length === 0) return [];

  const memeIds = userInteractions.map((i: any) => i.meme_id);
  const { data: similarUsers } = await supabase
    .from("user_meme_interactions")
    .select("user_id")
    .in("meme_id", memeIds)
    .neq("user_id", userId);

  if (!similarUsers) return [];

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

  const similarUserIds = await findSimilarUsers(userId, 5);
  
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

  const { data: eloMemes } = await supabase
    .from("memes")
    .select(`
      *,
      profiles:user_id(username, avatar_url)
    `)
    .eq("status", "approved")
    .order("score", { ascending: false })
    .range(page * 5, (page + 1) * 5 - 1);

  const allMemes = [...(collaborativeMemes || []), ...(eloMemes || [])];
  const uniqueMemes = Array.from(
    new Map(allMemes.map((m: any) => [m.id, m])).values()
  );

  return uniqueMemes.sort((a, b) => {
    const aScore = a.score || 0;
    const bScore = b.score || 0;
    if (Math.abs(aScore - bScore) > 10) {
      return bScore - aScore;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function UnifiedFeedPage() {
  const { publicKey, connected } = useWallet();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"foryou" | "feed">("foryou");
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const { isPremium } = usePremium();

  const fetchFeed = useCallback(async (pageNum: number = 0) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(pageNum * 5, (pageNum + 1) * 5 - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemes((prev) => {
          const newMemes = data.filter((d: any) => !prev.some((p: any) => p.id === d.id));
          return pageNum === 0 ? data : [...prev, ...newMemes];
        });
        setHasMore(data.length === 5);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchTrendingFeed = useCallback(async (pageNum: number = 0) => {
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
        .range(pageNum * 10, (pageNum + 1) * 10 - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemes((prev) => {
          const newMemes = data.filter((m: any) => !prev.some((p: any) => p.id === m.id));
          return pageNum === 0 ? data : [...prev, ...newMemes];
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
  }, [supabase]);

  const fetchPersonalizedFeed = useCallback(async (pageNum: number = 0) => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        fetchTrendingFeed(pageNum);
        return;
      }

      const personalizedMemes = await getPersonalizedFeed(user.user.id, pageNum);
      
      if (personalizedMemes && personalizedMemes.length > 0) {
        setMemes((prev) => {
          const newMemes = personalizedMemes.filter((m: any) => !prev.some((p: any) => p.id === m.id));
          return pageNum === 0 ? personalizedMemes : [...prev, ...newMemes];
        });
        setHasMore(personalizedMemes.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      fetchTrendingFeed(pageNum);
    } finally {
      setLoading(false);
    }
  }, [supabase, publicKey, fetchTrendingFeed]);

  // Fetch memes based on active tab
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    if (activeTab === "feed") {
      fetchFeed();
    } else {
      if (connected && publicKey) {
        fetchPersonalizedFeed();
      } else {
        fetchTrendingFeed();
      }
    }
  }, [activeTab, connected, publicKey, supabase, fetchFeed, fetchPersonalizedFeed, fetchTrendingFeed]);

  useEffect(() => {
    if (!supabase) return;
    
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      if (activeTab === "feed") {
        fetchFeed(nextPage);
      } else {
        if (connected && publicKey) {
          fetchPersonalizedFeed(nextPage);
        } else {
          fetchTrendingFeed(nextPage);
        }
      }
    }
  }, [inView, hasMore, loading, activeTab, supabase, connected, publicKey, page, fetchFeed, fetchPersonalizedFeed, fetchTrendingFeed]);

  // Reset when tab changes
  useEffect(() => {
    setMemes([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  }, [activeTab]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("memes-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "memes",
          filter: "status=eq.approved"
        },
        (payload: any) => {
          supabase
            .from("memes")
            .select("*, profiles:user_id(username, avatar_url)")
            .eq("id", payload.new.id)
            .single()
            .then((response: { data: any }) => {
              const { data } = response;
              if (data) {
                setMemes((prev) => [data, ...prev]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Show error if Supabase is not configured
  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">
          Configuration Supabase manquante. Veuillez configurer les variables d&apos;environnement.
        </p>
      </div>
    );
  }

  if (loading && memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">
          {activeTab === "foryou" ? "Crafting your perfect feed... ✨" : "Loading latest bangers..."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Tabs */}
      <div className="sticky top-16 z-40 glass-effect border-b border-purple-500/20 backdrop-blur-xl bg-black/50 mb-4">
        <div className="container mx-auto px-4 py-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "foryou" | "feed")} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-black/50">
              <TabsTrigger value="foryou" className="gap-2">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="feed" className="gap-2">
                <Home className="h-4 w-4" />
                Feed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Empty State */}
      {memes.length === 0 && !loading && (
        <div className="container mx-auto px-4 pb-24 max-w-xl">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Feed is quiet... too quiet.</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Be the first to drop a legendary meme and earn huge rewards.
            </p>
            <Button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent('open-upload-dialog'));
                }
              }}
              variant="neon"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-purple-500/20"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload First Meme
            </Button>
          </div>
        </div>
      )}

      {/* Memes Feed - Virtualized TikTok-style */}
      {memes.length > 0 && (
        <VirtualizedFeed
          memes={memes}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            if (activeTab === "feed") {
              fetchFeed(nextPage);
            } else {
              if (connected && publicKey) {
                fetchPersonalizedFeed(nextPage);
              } else {
                fetchTrendingFeed(nextPage);
              }
            }
          }}
          className="fixed top-32 bottom-0 left-0 right-0"
        />
      )}

        {/* End of Feed */}
        {!hasMore && memes.length > 0 && (
          <div className="text-center py-12">
            <div className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm text-muted-foreground">
              ✨ {activeTab === "foryou" ? "You've seen all personalized memes!" : "You're all caught up!"}
            </div>
          </div>
        )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Upload & Support Button */}
        <FloatingActionButton />
      </div>
    </div>
  );
}


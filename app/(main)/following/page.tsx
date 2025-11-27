"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { useInView } from "react-intersection-observer";
import { Loader2, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function FollowingPage() {
  const { publicKey, connected } = useWallet();
  const supabase = createClient();
  const { toast } = useToast();
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchFollowingFeed();
    }
  }, [connected, publicKey, page]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFollowingFeed(nextPage);
    }
  }, [inView, hasMore, loading]);

  const fetchFollowingFeed = async (pageNum: number = 0) => {
    if (!supabase || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      // Get users that current user is following
      const { data: following, error: followError } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.user.id);

      if (followError) throw followError;

      if (!following || following.length === 0) {
        setMemes([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const followingIds = following.map((f: any) => f.following_id);

      // Get memes from followed users
      const { data, error } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url, reputation_score)")
        .in("user_id", followingIds)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(pageNum * 10, (pageNum + 1) * 10 - 1);

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
      console.error("Error fetching following feed:", error);
      setMemes([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates from followed users
  useEffect(() => {
    if (!supabase || !connected || !publicKey) return;

    const { data: user } = supabase.auth.getUser();
    user.then(({ user: authUser }: { user: any }) => {
      if (!authUser) return;

      const channel = supabase
        .channel("following-feed")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "memes",
            filter: "status=eq.approved",
          },
          (payload: any) => {
            // Check if meme is from a followed user
            supabase
              .from("followers")
              .select("following_id")
              .eq("follower_id", authUser.id)
              .eq("following_id", payload.new.user_id)
              .single()
              .then(({ data: isFollowing }: { data: any }) => {
                if (isFollowing) {
                  // Fetch full meme details
                  supabase
                    .from("memes")
                    .select("*, profiles:user_id(username, avatar_url, reputation_score)")
                    .eq("id", payload.new.id)
                    .single()
                    .then(({ data: meme }: { data: any }) => {
                      if (meme) {
                        setMemes((prev) => [meme, ...prev]);
                      }
                    });
                }
              });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [supabase, connected, publicKey]);

  if (!connected || !publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users className="h-16 w-16 text-purple-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Connectez votre wallet</h2>
        <p className="text-muted-foreground mb-4">
          Suivez vos créateurs préférés et voyez leurs memes en premier
        </p>
      </div>
    );
  }

  if (loading && memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">Chargement du feed Following...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Following
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Memes des créateurs que vous suivez
          </p>
        </div>
      </div>

      {/* Empty State */}
      {memes.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Users className="h-20 w-20 text-purple-500/50 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Aucun meme à suivre</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Suivez des créateurs pour voir leurs memes ici. Explorez le feed pour découvrir de
            nouveaux talents !
          </p>
          <Button asChild variant="neon">
            <a href="/feed">Explorer le Feed</a>
          </Button>
        </div>
      )}

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
            ✨ Vous avez vu tous les memes de vos follows !
          </div>
        </div>
      )}
    </div>
  );
}


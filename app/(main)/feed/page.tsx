"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { useInView } from "react-intersection-observer";
import { Loader2, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdBanner } from "@/components/ads/ad-banner";
import { usePremium } from "@/hooks/use-premium";

// CHANGED: Export default added here to fix the Next.js error
export default function FeedPage() {
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const supabase = createClient();
  const { isPremium } = usePremium();

  const fetchMemes = async (pageNum: number) => {
    try {
      if (!supabase) {
        setMemes([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

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
          return [...prev, ...newMemes];
        });
        setHasMore(data.length === 5);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching memes:", error);
      setMemes([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemes(0);
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMemes(nextPage);
    }
  }, [inView, hasMore, loading]);

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
            .then(({ data }: { data: any }) => {
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

  if (loading && memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">Loading latest bangers...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="container mx-auto px-4 pb-20 max-w-xl">
        
        {/* Ads Banner (Top) - Only if not premium */}
        {!isPremium && <AdBanner variant="top" />}

        {memes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <Zap className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Feed is quiet... too quiet.</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Be the first to drop a legendary meme and earn huge rewards.
            </p>
            <Button 
              variant="neon" 
              size="lg" 
              className="w-full sm:w-auto shadow-xl shadow-purple-500/20"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent('open-upload-dialog'));
                }
              }}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload First Meme
            </Button>
          </div>
        )}

        <div className="space-y-8 py-6">
          {memes.map((meme, index) => (
            <div key={meme.id}>
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MemeCard meme={meme} />
               </div>
               
               {/* In-Feed Ad every 5 memes - Only if not premium */}
               {(index + 1) % 5 === 0 && !isPremium && (
                 <div className="mt-8 mb-8">
                   <AdBanner variant="inline" />
                 </div>
               )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div ref={ref} className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        )}

        {!hasMore && memes.length > 0 && (
          <div className="text-center py-12">
             <div className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm text-muted-foreground">
               ✨ You&apos;re all caught up!
             </div>
          </div>
        )}
      </div>

    </div>
  );
}

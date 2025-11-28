"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { useInView } from "react-intersection-observer";
import { Loader2, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FeedPage() {
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const supabase = createClient();

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
        .range(pageNum * 10, (pageNum + 1) * 10 - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemes((prev) => [...prev, ...data]);
        setHasMore(data.length === 10);
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

  // Subscribe to real-time updates
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Upload CTA - Only show if no memes */}
        {memes.length === 0 && !loading && (
          <div className="mb-6 glass-effect rounded-lg p-6 text-center border border-purple-500/30">
            <h2 className="text-xl font-semibold mb-2">
              Partagez votre premier meme ! 🚀
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Gagnez des récompenses dès aujourd&apos;hui
            </p>
            <Button 
              variant="neon" 
              size="lg" 
              className="gap-2"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent('open-upload-dialog'));
                }
              }}
            >
              <Plus className="h-5 w-5" />
                Créer le premier meme
              </Link>
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {memes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>

        {hasMore && (
          <div ref={ref} className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        )}

        {!hasMore && memes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucun meme pour le moment
            </p>
            <p className="text-sm text-muted-foreground">
              {!supabase && "Configurez Supabase pour voir les memes"}
            </p>
          </div>
        )}

        {!hasMore && memes.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Vous avez vu tous les memes ! 🎉
          </div>
        )}
      </div>

      {/* Floating Upload Button */}
    </>
  );
}


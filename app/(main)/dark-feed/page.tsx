"use client";

import { useState, useEffect } from "react";
import { usePremium } from "@/hooks/use-premium";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { useInView } from "react-intersection-observer";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DarkFeedPage() {
  const { isPremium, isTrial } = usePremium();
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const supabase = createClient();

  const fetchDarkFeed = async (pageNum: number) => {
    if (!supabase) return;
    
    try {
      // Dark Feed = memes exclusifs Premium (tagged as premium_only)
      const { data, error } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .eq("premium_only", true) // Only premium memes
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
      console.error("Error fetching dark feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium) {
      fetchDarkFeed(0);
    }
  }, [isPremium]);

  useEffect(() => {
    if (inView && hasMore && !loading && isPremium) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDarkFeed(nextPage);
    }
  }, [inView, hasMore, loading, isPremium]);

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="glass-effect border-purple-500/20">
          <CardHeader className="text-center">
            <Lock className="h-16 w-16 mx-auto text-purple-400 mb-4" />
            <CardTitle className="text-3xl mb-2">Dark Feed Exclusif 🔒</CardTitle>
            <CardDescription className="text-lg">
              Accédez aux memes les plus exclusifs réservés aux membres Premium
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span>Memes exclusifs que personne d&apos;autre ne voit</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span>Contenu créé par les meilleurs créateurs</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span>Accès anticipé aux memes viraux</span>
              </div>
            </div>
            <Button asChild variant="neon" size="lg" className="w-full">
              <Link href="/premium">
                Débloquer Premium - Essai gratuit 3 jours →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">Loading exclusive memes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-20 max-w-xl">
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Dark Feed Exclusif</h2>
        </div>
        <p className="text-sm text-gray-300">
          {isTrial 
            ? "🎁 Vous profitez de l&apos;essai gratuit Premium - Accès complet au Dark Feed"
            : "👑 Contenu exclusif réservé aux membres Premium"
          }
        </p>
      </div>

      {memes.length === 0 && !loading && (
        <Card className="glass-effect border-purple-500/20">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto text-purple-400 mb-4" />
            <p className="text-muted-foreground">
              Aucun meme exclusif pour le moment. Revenez bientôt !
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8 py-6">
        {memes.map((meme) => (
          <div key={meme.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MemeCard meme={meme} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}
    </div>
  );
}


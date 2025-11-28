"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

export function FeedPreview() {
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchMemes();
  }, []);

  const fetchMemes = async () => {
    try {
      if (!supabase) {
        setMemes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data) {
        setMemes(data);
      }
    } catch (error) {
      console.error("Error fetching memes:", error);
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Derniers Memes
        </h2>
        <p className="text-muted-foreground mb-6">
          Découvrez les memes les plus récents
        </p>
      </div>

      {memes.length > 0 ? (
        <>
          <div className="grid gap-6 max-w-2xl mx-auto mb-8">
            {memes.map((meme) => (
              <MemeCard key={meme.id} meme={meme} />
            ))}
          </div>
          <div className="text-center">
            <Button asChild variant="neon" size="lg" className="gap-2">
              <Link href="/feed">
                Voir tous les memes
                <ArrowDown className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Aucun meme pour le moment
          </p>
          <Button 
            variant="neon" 
            size="lg"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('open-upload-dialog'));
              }
            }}
          >
            Créer le premier meme
          </Button>
        </div>
      )}
    </div>
  );
}


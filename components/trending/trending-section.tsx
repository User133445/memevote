"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemeCard } from "@/components/meme/meme-card";
import { TrendingUp, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TrendingMeme {
  id: string;
  meme_id: string;
  trending_type: "hot_now" | "rising_stars";
  viral_score: number;
  memes?: any;
}

export function TrendingSection() {
  const [hotMemes, setHotMemes] = useState<any[]>([]);
  const [risingMemes, setRisingMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (supabase) {
      fetchTrending();
    }
  }, [supabase]);

  const fetchTrending = async () => {
    if (!supabase) return;
    
    try {
      // Fetch hot now memes
      const { data: hotData, error: hotError } = await supabase
        .from("trending_memes")
        .select("*, memes(*)")
        .eq("trending_type", "hot_now")
        .gt("expires_at", new Date().toISOString())
        .order("viral_score", { ascending: false })
        .limit(10);

      if (!hotError && hotData) {
        setHotMemes(hotData.map((item: any) => item.memes).filter(Boolean));
      }

      // Fetch rising stars memes
      const { data: risingData, error: risingError } = await supabase
        .from("trending_memes")
        .select("*, memes(*)")
        .eq("trending_type", "rising_stars")
        .gt("expires_at", new Date().toISOString())
        .order("viral_score", { ascending: false })
        .limit(10);

      if (!risingError && risingData) {
        setRisingMemes(risingData.map((item: any) => item.memes).filter(Boolean));
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des tendances...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Tendances
          </CardTitle>
          <CardDescription>
            Découvrez les memes qui font le buzz, propulsés par l&apos;IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hot" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hot" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Hot Now
              </TabsTrigger>
              <TabsTrigger value="rising" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Rising Stars
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hot" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotMemes.length > 0 ? (
                  hotMemes.map((meme) => (
                    <MemeCard key={meme.id} meme={meme} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Aucun meme trending pour le moment
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rising" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {risingMemes.length > 0 ? (
                  risingMemes.map((meme) => (
                    <MemeCard key={meme.id} meme={meme} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Aucun meme en hausse pour le moment
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


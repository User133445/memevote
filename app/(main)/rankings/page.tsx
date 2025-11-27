"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemeCard } from "@/components/meme/meme-card";
import { Trophy, TrendingUp, Swords, Flame, Star } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";

export default function RankingsPage() {
  const { publicKey, connected } = useWallet();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("trending");
  const [trendingMemes, setTrendingMemes] = useState<any[]>([]);
  const [leaderboardMemes, setLeaderboardMemes] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (activeTab === "trending") {
      fetchTrending();
    } else if (activeTab === "leaderboard") {
      fetchLeaderboard();
    } else if (activeTab === "battles") {
      fetchBattles();
    }
  }, [activeTab]);

  const fetchTrending = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("viral_score", { ascending: false, nullsFirst: false })
        .limit(20);

      if (data) setTrendingMemes(data);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("score", { ascending: false })
        .limit(50);

      if (data) setLeaderboardMemes(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBattles = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("battles")
        .select(`
          *,
          meme1:memes!battles_meme1_id_fkey(*, profiles:user_id(username)),
          meme2:memes!battles_meme2_id_fkey(*, profiles:user_id(username))
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setBattles(data);
    } catch (error) {
      console.error("Error fetching battles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Rankings & Battles 🏆
        </h1>
        <p className="text-muted-foreground">
          Découvrez les memes les plus populaires et les battles en cours
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="trending" className="gap-2">
            <Flame className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="battles" className="gap-2">
            <Swords className="h-4 w-4" />
            Battles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>Hot Now - Les memes les plus viraux en ce moment</span>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {trendingMemes.map((meme, index) => (
                <div key={meme.id} className="relative">
                  <div className="absolute -left-4 top-4 z-10 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <MemeCard meme={meme} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Top 50 - Classement global</span>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">Daily</button>
                <button className="px-2 py-1 rounded text-muted-foreground">Weekly</button>
                <button className="px-2 py-1 rounded text-muted-foreground">Global</button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {leaderboardMemes.map((meme, index) => (
                <div key={meme.id} className="relative">
                  <div className="absolute -left-4 top-4 z-10 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <MemeCard meme={meme} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="battles">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {battles.length === 0 ? (
                <Card className="glass-effect border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <Swords className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune battle en cours</p>
                  </CardContent>
                </Card>
              ) : (
                battles.map((battle) => (
                  <Card key={battle.id} className="glass-effect border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-red-400" />
                        Battle #{battle.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        Pot: {battle.pot_amount || 0} $VOTE
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Meme 1</p>
                          {battle.meme1 && <MemeCard meme={battle.meme1} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Meme 2</p>
                          {battle.meme2 && <MemeCard meme={battle.meme2} />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


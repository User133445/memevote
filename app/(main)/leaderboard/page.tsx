"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";

const REWARDS = {
  1: 1500,
  2: 1000,
  3: 750,
  4: 500,
  5: 250,
};

export default function LeaderboardPage() {
  const [daily, setDaily] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [global, setGlobal] = useState<any[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchLeaderboard("daily");
    fetchLeaderboard("weekly");
    fetchLeaderboard("global");
  }, [category]);

  const fetchLeaderboard = async (period: string) => {
    try {
      if (!supabase) {
        setDaily([]);
        setWeekly([]);
        setGlobal([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("memes")
        .select("*, profiles:user_id(username, avatar_url)")
        .eq("status", "approved")
        .order("score", { ascending: false })
        .limit(50);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (period === "daily") setDaily(data || []);
      if (period === "weekly") setWeekly(data || []);
      if (period === "global") setGlobal(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      if (period === "daily") setDaily([]);
      if (period === "weekly") setWeekly([]);
      if (period === "global") setGlobal([]);
    } finally {
      setLoading(false);
    }
  };

  const LeaderboardList = ({ memes }: { memes: any[] }) => (
    <div className="space-y-2">
      {memes.map((meme, index) => {
        const rank = index + 1;
        const reward = REWARDS[rank as keyof typeof REWARDS] || 0;
        const Icon =
          rank === 1 ? Trophy : rank === 2 ? Medal : rank === 3 ? Award : null;

        return (
          <div
            key={meme.id}
            className="glass-effect rounded-lg p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform"
          >
            <div className="flex-shrink-0 w-12 text-center">
              {Icon ? (
                <Icon
                  className={`h-8 w-8 mx-auto ${
                    rank === 1
                      ? "text-yellow-400"
                      : rank === 2
                      ? "text-gray-300"
                      : "text-orange-400"
                  }`}
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  #{rank}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{meme.title}</h3>
              <p className="text-sm text-muted-foreground">
                par {meme.profiles?.username || "Anonyme"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">
                {formatNumber(meme.score)}
              </div>
              {reward > 0 && (
                <div className="text-xs text-muted-foreground">
                  {reward} USDC
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Classement
      </h1>

      <Tabs defaultValue="daily" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="daily">Quotidien</TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 rounded-md bg-background border border-input"
          >
            <option value="all">Toutes les catégories</option>
            <option value="AI">AI</option>
            <option value="Politics">Politics</option>
            <option value="Animals">Animals</option>
            <option value="Gaming">Gaming</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <TabsContent value="daily">
          {loading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : (
            <LeaderboardList memes={daily} />
          )}
        </TabsContent>

        <TabsContent value="weekly">
          {loading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : (
            <LeaderboardList memes={weekly} />
          )}
        </TabsContent>

        <TabsContent value="global">
          {loading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : (
            <LeaderboardList memes={global} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


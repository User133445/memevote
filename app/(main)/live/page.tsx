"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MemeCard } from "@/components/meme/meme-card";
import { ActivityFeed } from "@/components/live/activity-feed";
import { LiveStats } from "@/components/live/live-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, TrendingUp, Users, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LivePage() {
  const [recentMemes, setRecentMemes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalMemes: 0,
    activeUsers: 0,
    totalVolume: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchRecentMemes();
    fetchActivities();
    fetchStats();
    
    // Subscribe to real-time updates
    if (!supabase) return;

    const memesChannel = supabase
      .channel("live-memes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "memes",
          filter: "status=eq.approved",
        },
        (payload: any) => {
          fetchRecentMemes();
          fetchActivities();
        }
      )
      .subscribe();

    const votesChannel = supabase
      .channel("live-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          fetchActivities();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(memesChannel);
        supabase.removeChannel(votesChannel);
      }
    };
  }, [supabase]);

  const fetchRecentMemes = async () => {
    if (!supabase) {
      setRecentMemes([]);
      return;
    }

    const { data } = await supabase
      .from("memes")
      .select("*, profiles:user_id(username, avatar_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setRecentMemes(data);
  };

  const fetchActivities = async () => {
    if (!supabase) {
      setActivities([]);
      return;
    }

    // Get recent votes and memes
    const { data: votes } = await supabase
      .from("votes")
      .select("*, memes:memes(title, file_url), profiles:memes.user_id(username)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (votes) {
      const activities = votes.map((vote: any) => ({
        id: vote.id,
        type: vote.type === 1 ? "upvote" : "downvote",
        meme: vote.memes,
        user: vote.profiles,
        timestamp: vote.created_at,
      }));
      setActivities(activities);
    }
  };

  const fetchStats = async () => {
    if (!supabase) {
      setStats({
        totalVotes: 0,
        totalMemes: 0,
        activeUsers: 0,
        totalVolume: 0,
      });
      return;
    }

    const { data: votes } = await supabase
      .from("votes")
      .select("id")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: memes } = await supabase
      .from("memes")
      .select("id")
      .eq("status", "approved")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    setStats({
      totalVotes: votes?.length || 0,
      totalMemes: memes?.length || 0,
      activeUsers: 0, // Would need to calculate from unique users
      totalVolume: 0, // Would calculate from staking/transactions
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Live Feed 🔴
        </h1>
        <div className="flex items-center gap-2 text-red-500">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">EN DIRECT</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="memes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="memes">
                <TrendingUp className="h-4 w-4 mr-2" />
                Nouveaux Memes
              </TabsTrigger>
              <TabsTrigger value="activities">
                <Zap className="h-4 w-4 mr-2" />
                Activités
              </TabsTrigger>
            </TabsList>

            <TabsContent value="memes" className="space-y-4">
              {recentMemes.map((meme) => (
                <MemeCard key={meme.id} meme={meme} />
              ))}
            </TabsContent>

            <TabsContent value="activities">
              <ActivityFeed activities={activities} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LiveStats stats={stats} />
          
          <Card className="glass-effect">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Top Trending</h3>
              <div className="space-y-2">
                {recentMemes.slice(0, 5).map((meme, index) => (
                  <div
                    key={meme.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-purple-500/10 transition-colors"
                  >
                    <span className="text-sm font-bold text-purple-400 w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm truncate flex-1">{meme.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {meme.score || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


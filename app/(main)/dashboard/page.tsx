"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@solana/wallet-adapter-react";
import { TrendingUp, Eye, ThumbsUp, Coins, Award, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMemes: 0,
    totalViews: 0,
    totalVotes: 0,
    totalEarnings: 0,
    rank: 0,
    points: 0,
  });
  const [myMemes, setMyMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey, connected } = useWallet();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey) {
      fetchStats();
      fetchMyMemes();
    }
  }, [connected, publicKey]);

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.user.id)
      .single();

    // Get user memes
    const { data: memes } = await supabase
      .from("memes")
      .select("id, views, score")
      .eq("user_id", user.user.id);

    // Get user votes
    const { data: votes } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", publicKey?.toString());

    const totalViews = memes?.reduce((sum: number, m: any) => sum + (m.views || 0), 0) || 0;
    const totalVotes = memes?.reduce((sum: number, m: any) => sum + (m.score || 0), 0) || 0;

    setStats({
      totalMemes: memes?.length || 0,
      totalViews,
      totalVotes,
      totalEarnings: parseFloat(profile?.total_earnings || "0"),
      rank: 0, // Would calculate from leaderboard
      points: profile?.points || 0,
    });

    setLoading(false);
  };

  const fetchMyMemes = async () => {
    if (!supabase) {
      setMyMemes([]);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("memes")
      .select("*, profiles:user_id(username)")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setMyMemes(data);
  };

  if (!connected || !publicKey) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-muted-foreground">
          Connectez votre wallet pour voir votre dashboard
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Memes",
      value: formatNumber(stats.totalMemes),
      icon: TrendingUp,
      color: "text-purple-400",
    },
    {
      label: "Vues",
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: "text-blue-400",
    },
    {
      label: "Votes",
      value: formatNumber(stats.totalVotes),
      icon: ThumbsUp,
      color: "text-green-400",
    },
    {
      label: "Gains",
      value: `${stats.totalEarnings.toFixed(2)} $VOTE`,
      icon: Coins,
      color: "text-yellow-400",
    },
    {
      label: "Points",
      value: formatNumber(stats.points),
      icon: Award,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Dashboard 📊
      </h1>

      <div className="grid md:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="memes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memes">Mes Memes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="memes">
          <div className="grid gap-4">
            {myMemes.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aucun meme uploadé</p>
                </CardContent>
              </Card>
            ) : (
              myMemes.map((meme) => (
                <Card key={meme.id} className="glass-effect">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{meme.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {meme.views || 0} vues • {meme.score || 0} votes
                        </p>
                      </div>
                      <div className="text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            meme.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : meme.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {meme.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Analytics Avancées</CardTitle>
              <CardDescription>
                Upgradez vers Pro Analytics pour des insights détaillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Pro Analytics (19€/mois) vous donne accès à :
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li>• Prédictions de memes viraux via IA</li>
                  <li>• Analytics détaillées par meme</li>
                  <li>• Tendances du marché</li>
                  <li>• Recommandations personnalisées</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


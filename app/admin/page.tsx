"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  FileImage, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMemes: 0,
    pendingMemes: 0,
    totalVotes: 0,
    reportsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, you would use a dedicated RPC function for efficiency
      // Or use count() queries
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
      const { count: memesCount } = await supabase.from("memes").select("*", { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from("memes").select("*", { count: 'exact', head: true }).eq("status", "pending");
      const { count: votesCount } = await supabase.from("votes").select("*", { count: 'exact', head: true });
      // Mock reports count as table might not exist yet
      const reportsCount = 0; 

      setStats({
        totalUsers: usersCount || 0,
        totalMemes: memesCount || 0,
        pendingMemes: pendingCount || 0,
        totalVotes: votesCount || 0,
        reportsCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vue d'ensemble</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Système opérationnel
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+12% depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memes Publiés</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMemes}</div>
            <p className="text-xs text-muted-foreground">+50 nouveaux aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votes Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalVotes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Engagement fort 🔥</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pendingMemes}</div>
            <p className="text-xs text-muted-foreground">Memes à modérer</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Derniers événements sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Nouveau meme uploadé</p>
                    <p className="text-xs text-zinc-400">Il y a {i * 5 + 2} minutes par User_{1000 + i}</p>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Info
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>Actions Requises</CardTitle>
            <CardDescription>Tâches prioritaires pour l'admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pendingMemes > 0 ? (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-500">Modération ({stats.pendingMemes})</p>
                    <p className="text-xs text-zinc-400">Memes en attente de validation</p>
                  </div>
                </div>
                <a href="/admin/moderation" className="px-3 py-1.5 rounded text-xs font-medium bg-yellow-500 text-black hover:bg-yellow-400">
                  Gérer
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-400">Toute la queue de modération est vide !</p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-500">Utilisateurs</p>
                    <p className="text-xs text-zinc-400">Gérer les rôles et bans</p>
                  </div>
                </div>
                <a href="/admin/users" className="px-3 py-1.5 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-400">
                  Voir
                </a>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


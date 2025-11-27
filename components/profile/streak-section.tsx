"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Coins, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";

export function StreakSection() {
  const [streakDays, setStreakDays] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchStreak();
    }
  }, [connected, publicKey, supabase]);

  const fetchStreak = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, last_activity_date")
        .eq("id", user.user.id)
        .single();

      if (profile) {
        setStreakDays(profile.streak_days || 0);
        
        // Calculate next reward milestone (every 7 days)
        const nextMilestone = Math.ceil((profile.streak_days || 0) / 7) * 7;
        setNextReward(nextMilestone);
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  };

  const handleStreakBooster = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Process payment of 100 $VOTE
      // For now, just skip the day
      await supabase
        .from("profiles")
        .update({
          streak_days: streakDays + 1,
          last_activity_date: new Date().toISOString(),
        })
        .eq("id", user.user.id);

      setStreakDays((prev) => prev + 1);
      toast({
        title: "Streak Booster activé !",
        description: "Votre streak a été prolongé d'un jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;activer le booster",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progressToNext = streakDays % 7;
  const progressPercentage = (progressToNext / 7) * 100;

  return (
    <Card className="glass-effect border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          Streak de Connexion
        </CardTitle>
        <CardDescription>
          Connectez-vous chaque jour pour maintenir votre streak et gagner des bonus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-orange-400 mb-2">
            {streakDays} jours
          </div>
          <p className="text-sm text-muted-foreground">
            Prochain bonus dans {7 - progressToNext} jours
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression vers bonus</span>
            <span className="font-medium">{progressToNext} / 7 jours</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {streakDays >= 7 && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">Bonus de Streak !</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vous avez reçu {formatNumber(streakDays * 10)} $VOTE pour votre streak de {streakDays} jours !
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Streak Booster</p>
              <p className="text-xs text-muted-foreground">
                Payez 100 $VOTE pour skip un jour et maintenir votre streak
              </p>
            </div>
            <Button
              onClick={handleStreakBooster}
              disabled={loading || streakDays === 0}
              variant="outline"
              size="sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              {loading ? "..." : "Booster"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


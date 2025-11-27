"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Coins, Target, Zap, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Quest = {
  id: string;
  quest_type: string;
  quest_name: string;
  description: string;
  target_value: number;
  reward_amount: number;
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [hasMultiplier, setHasMultiplier] = useState(false);
  const [loading, setLoading] = useState(true);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchQuests();
      fetchUserProgress();
      checkMultiplier();
    }
  }, [connected, publicKey, supabase]);

  const fetchQuests = async () => {
    if (!supabase) return;
    
    try {
      const { data } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("active", true)
        .order("reward_amount", { ascending: false });

      if (data) {
        setQuests(data);
      }
    } catch (error) {
      console.error("Error fetching quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("user_quest_progress")
        .select("*")
        .eq("user_id", user.user.id);

      if (data) {
        const progress: Record<string, number> = {};
        const completed = new Set<string>();
        
        data.forEach((item: any) => {
          progress[item.quest_id] = item.current_value;
          if (item.current_value >= item.target_value) {
            completed.add(item.quest_id);
          }
        });

        setUserProgress(progress);
        setCompletedQuests(completed);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const checkMultiplier = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("quest_multiplier_active")
        .eq("id", user.user.id)
        .single();

      if (data) {
        setHasMultiplier(data.quest_multiplier_active || false);
      }
    } catch (error) {
      console.error("Error checking multiplier:", error);
    }
  };

  const handleActivateMultiplier = async () => {
    if (!connected || !publicKey || !supabase) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Process payment of 10€ via Stripe or $VOTE
      // For now, just activate
      await supabase
        .from("profiles")
        .update({ quest_multiplier_active: true })
        .eq("id", user.user.id);

      setHasMultiplier(true);
      toast({
        title: "Quest Multiplier activé !",
        description: "Tous vos rewards de quêtes sont maintenant x2",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;activer le multiplier",
        variant: "destructive",
      });
    }
  };

  const getProgress = (questId: string) => {
    return userProgress[questId] || 0;
  };

  const getProgressPercentage = (quest: Quest) => {
    const current = getProgress(quest.id);
    return Math.min((current / quest.target_value) * 100, 100);
  };

  const isCompleted = (questId: string) => {
    return completedQuests.has(questId);
  };

  const getRewardAmount = (quest: Quest) => {
    return hasMultiplier ? quest.reward_amount * 2 : quest.reward_amount;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Daily Quests 🎯
        </h1>
        <p className="text-muted-foreground">
          Complétez les quêtes quotidiennes et gagnez des $VOTE
        </p>
      </div>

      {/* Quest Multiplier Upsell */}
      {!hasMultiplier && (
        <Card className="glass-effect border-yellow-500/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Quest Multiplier - x2 Rewards
            </CardTitle>
            <CardDescription>
              Activez le multiplier pour doubler tous vos rewards de quêtes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-400 mb-1">10€ / mois</p>
                <p className="text-sm text-muted-foreground">
                  Double tous vos rewards de quêtes quotidiennes
                </p>
              </div>
              <Button onClick={handleActivateMultiplier} variant="neon" size="lg">
                <Zap className="h-4 w-4 mr-2" />
                Activer Multiplier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasMultiplier && (
        <Card className="glass-effect border-green-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">Quest Multiplier actif - Tous vos rewards sont x2 !</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {quests.map((quest) => {
            const progress = getProgress(quest.id);
            const percentage = getProgressPercentage(quest);
            const completed = isCompleted(quest.id);
            const reward = getRewardAmount(quest);

            return (
              <Card
                key={quest.id}
                className={`glass-effect border-purple-500/20 ${
                  completed ? "border-green-500/50 bg-green-500/5" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {quest.quest_name}
                          {hasMultiplier && (
                            <Badge variant="secondary" className="text-xs">
                              x2
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {formatNumber(reward)} $VOTE
                      </div>
                      {hasMultiplier && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatNumber(quest.reward_amount)} $VOTE
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">
                          {progress} / {quest.target_value}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                    {completed && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-400 font-medium">
                          ✅ Quête complétée ! {formatNumber(reward)} $VOTE ajoutés à votre compte
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

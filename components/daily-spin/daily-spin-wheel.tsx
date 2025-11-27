"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, Zap, Crown, Trophy, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SpinReward {
  id: string;
  reward_type: string;
  reward_name: string;
  reward_description: string;
  reward_value: number;
  reward_duration: number;
  probability: number;
}

interface UserSpin {
  spins_used: number;
  max_spins: number;
  last_spin_at: string | null;
}

export function DailySpinWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [userSpin, setUserSpin] = useState<UserSpin | null>(null);
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [lastResult, setLastResult] = useState<SpinReward | null>(null);
  const [rotation, setRotation] = useState(0);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchSpinData();
    }
  }, [connected, publicKey, supabase]);

  const fetchSpinData = async () => {
    if (!supabase || !publicKey) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get user daily spin data
      const { data: spinData } = await supabase
        .from("user_daily_spins")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("spin_date", new Date().toISOString().split("T")[0])
        .single();

      if (spinData) {
        setUserSpin(spinData as UserSpin);
      } else {
        // Create new daily spin record
        const { data: newSpin } = await supabase
          .from("user_daily_spins")
          .insert({
            user_id: user.user.id,
            spin_date: new Date().toISOString().split("T")[0],
            spins_used: 0,
            max_spins: 3,
          })
          .select()
          .single();

        if (newSpin) {
          setUserSpin(newSpin as UserSpin);
        }
      }

      // Get available rewards
      const { data: rewardsData } = await supabase
        .from("daily_spin_rewards")
        .select("*")
        .eq("is_active", true)
        .order("probability", { ascending: false });

      if (rewardsData) {
        setRewards(rewardsData as SpinReward[]);
      }
    } catch (error) {
      console.error("Error fetching spin data:", error);
    }
  };

  const handleSpin = async () => {
    if (!supabase || !publicKey || !userSpin) return;

    if (userSpin.spins_used >= userSpin.max_spins) {
      toast({
        title: "Spins épuisées",
        description: "Vous avez utilisé tous vos spins gratuits aujourd&apos;hui. Revenez demain !",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Select reward based on probability
      const selectedReward = selectRewardByProbability(rewards);

      // Animate spin
      const spins = 5 + Math.random() * 5; // 5-10 full rotations
      const finalRotation = rotation + spins * 360;
      setRotation(finalRotation);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Record spin result
      const expiresAt = selectedReward.reward_duration > 0
        ? new Date(Date.now() + selectedReward.reward_duration * 60 * 60 * 1000).toISOString()
        : null;

      const { error: resultError } = await supabase.from("spin_results").insert({
        user_id: user.user.id,
        reward_id: selectedReward.id,
        reward_type: selectedReward.reward_type,
        reward_value: selectedReward.reward_value,
        expires_at: expiresAt,
        is_active: true,
      });

      if (resultError) throw resultError;

      // Update user spin count
      const { error: updateError } = await supabase
        .from("user_daily_spins")
        .update({
          spins_used: userSpin.spins_used + 1,
          last_spin_at: new Date().toISOString(),
        })
        .eq("user_id", user.user.id)
        .eq("spin_date", new Date().toISOString().split("T")[0]);

      if (updateError) throw updateError;

      setLastResult(selectedReward);
      setUserSpin({
        ...userSpin,
        spins_used: userSpin.spins_used + 1,
      });

      // Show success toast
      toast({
        title: "🎉 Félicitations !",
        description: `Vous avez gagné : ${selectedReward.reward_name}`,
      });

      // Apply reward if needed
      if (selectedReward.reward_type === "bonus" && selectedReward.reward_value > 0) {
        // TODO: Add $VOTE to user wallet
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;effectuer le spin",
        variant: "destructive",
      });
    } finally {
      setIsSpinning(false);
    }
  };

  const selectRewardByProbability = (rewards: SpinReward[]): SpinReward => {
    const total = rewards.reduce((sum, r) => sum + r.probability, 0);
    let random = Math.random() * total;

    for (const reward of rewards) {
      if (random <= reward.probability) {
        return reward;
      }
      random -= reward.probability;
    }

    return rewards[0]; // Fallback
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "multiplier":
        return <Zap className="h-6 w-6 text-yellow-400" />;
      case "bonus":
        return <Coins className="h-6 w-6 text-green-400" />;
      case "vip":
        return <Crown className="h-6 w-6 text-purple-400" />;
      case "lucky_streak":
        return <Sparkles className="h-6 w-6 text-pink-400" />;
      case "badge":
        return <Trophy className="h-6 w-6 text-blue-400" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const spinsRemaining = userSpin ? userSpin.max_spins - userSpin.spins_used : 0;
  const canSpin = spinsRemaining > 0 && !isSpinning;

  return (
    <>
      {/* Spin Button (Floating) - Only show if user is connected */}
      {connected && publicKey && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-purple-500/50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-effect border-purple-500/20 bg-black/95 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎲 Daily Spin
            </DialogTitle>
            <DialogDescription className="text-center">
              Spins gratuits quotidiens - Pas de mise d&apos;argent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Spin Counter */}
            <Card className="glass-effect border-purple-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {spinsRemaining} / {userSpin?.max_spins || 3}
                </div>
                <div className="text-sm text-muted-foreground">Spins restants aujourd&apos;hui</div>
              </CardContent>
            </Card>

            {/* Spin Wheel */}
            <div className="relative w-full aspect-square max-w-xs mx-auto">
              <div
                className={cn(
                  "w-full h-full rounded-full border-4 border-purple-500/50 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center transition-transform duration-3000 ease-out",
                  isSpinning && "animate-spin"
                )}
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="text-center z-10">
                  <Sparkles className="h-12 w-12 mx-auto text-purple-400 mb-2" />
                  <div className="text-lg font-bold">SPIN</div>
                </div>
              </div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-400" />
              </div>
            </div>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={!canSpin}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              {isSpinning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  En cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Spin Gratuit
                </>
              )}
            </Button>

            {/* Last Result */}
            {lastResult && (
              <Card className="glass-effect border-green-500/50 bg-green-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {getRewardIcon(lastResult.reward_type)}
                    <div className="flex-1">
                      <div className="font-bold text-green-400">{lastResult.reward_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lastResult.reward_description}
                      </div>
                      {lastResult.reward_value > 0 && (
                        <div className="text-sm text-purple-400 mt-1">
                          +{formatNumber(lastResult.reward_value)} $VOTE
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Rewards Preview */}
            <div>
              <div className="text-sm font-bold mb-2 text-muted-foreground">
                Récompenses possibles :
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rewards.slice(0, 4).map((reward) => (
                  <Badge
                    key={reward.id}
                    variant="outline"
                    className="text-xs justify-start gap-1 border-purple-500/20"
                  >
                    {getRewardIcon(reward.reward_type)}
                    {reward.reward_name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


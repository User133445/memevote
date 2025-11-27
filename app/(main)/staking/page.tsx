"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Zap, Crown, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const TIERS = [
  {
    name: "Chad",
    minAmount: 1000,
    votesPerDay: 50,
    feedBoost: 20,
    apr: 5,
    icon: Zap,
    color: "text-green-400",
  },
  {
    name: "Diamond",
    minAmount: 10000,
    votesPerDay: 500,
    feedBoost: 50,
    apr: 10,
    icon: Gem,
    color: "text-blue-400",
  },
  {
    name: "Whale",
    minAmount: 100000,
    votesPerDay: -1, // unlimited
    feedBoost: 100,
    apr: 15,
    icon: Crown,
    color: "text-purple-400",
  },
];

export default function StakingPage() {
  const [amount, setAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [staking, setStaking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey) {
      fetchStaking();
    }
  }, [connected, publicKey]);

  const fetchStaking = async () => {
    if (!publicKey || !supabase) return;

    const { data } = await supabase
      .from("staking")
      .select("*")
      .eq("wallet_address", publicKey.toString())
      .single();

    if (data) {
      setStaking(data);
      setSelectedTier(data.tier);
    }
  };

  const handleStake = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour staker",
        variant: "destructive",
      });
      return;
    }

    const stakeAmount = parseFloat(amount);
    if (!stakeAmount || stakeAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Entrez un montant valide",
        variant: "destructive",
      });
      return;
    }

    // Find appropriate tier
    const tier = TIERS.find((t) => stakeAmount >= t.minAmount);
    if (!tier) {
      toast({
        title: "Montant insuffisant",
        description: `Minimum ${TIERS[0].minAmount} $VOTE requis`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      // In production, this would interact with Solana program
      // For now, we&apos;ll just store in Supabase
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error("Utilisateur non connecté");
      }

      const { error } = await supabase.from("staking").insert({
        user_id: user.user.id,
        wallet_address: publicKey.toString(),
        amount: stakeAmount,
        tier: tier.name,
        apr: tier.apr,
        locked_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

      if (error) throw error;

      toast({
        title: "Staking réussi !",
        description: `Vous êtes maintenant ${tier.name}`,
      });

      fetchStaking();
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de staker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Staking $VOTE
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.name;
          const isActive = staking?.tier === tier.name;

          return (
            <Card
              key={tier.name}
              className={`glass-effect cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-purple-500" : ""
              } ${isActive ? "border-purple-500" : ""}`}
              onClick={() => setSelectedTier(tier.name)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className={`h-6 w-6 ${tier.color}`} />
                  <CardTitle>{tier.name}</CardTitle>
                </div>
                <CardDescription>
                  Min: {tier.minAmount.toLocaleString()} $VOTE
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div>Votes/jour: {tier.votesPerDay === -1 ? "∞" : tier.votesPerDay}</div>
                  <div>Boost feed: +{tier.feedBoost}%</div>
                  <div>APR: {tier.apr}%</div>
                </div>
                {isActive && (
                  <div className="text-xs text-green-400 mt-2">
                    ✓ Actif
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {connected && publicKey ? (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Staker $VOTE</CardTitle>
            <CardDescription>
              Verrouillez vos tokens et gagnez des récompenses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Montant ($VOTE)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min={TIERS[0].minAmount}
              />
            </div>
            {selectedTier && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-sm space-y-1">
                  <div>Tier sélectionné: <strong>{selectedTier}</strong></div>
                  <div>APR: {TIERS.find((t) => t.name === selectedTier)?.apr}%</div>
                  <div>Période: 30 jours</div>
                </div>
              </div>
            )}
            <Button
              onClick={handleStake}
              disabled={loading || !selectedTier || !amount}
              className="w-full"
              variant="neon"
            >
              <Coins className="mr-2 h-5 w-5" />
              {loading ? "Staking..." : "Staker"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Connectez votre wallet pour commencer à staker
            </p>
          </CardContent>
        </Card>
      )}

      {staking && (
        <Card className="glass-effect mt-6">
          <CardHeader>
            <CardTitle>Votre Staking Actif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Tier: <strong>{staking.tier}</strong></div>
              <div>Montant: {staking.amount} $VOTE</div>
              <div>APR: {staking.apr}%</div>
              <div>Récompenses totales: {staking.total_rewards} $VOTE</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


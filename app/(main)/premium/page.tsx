"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Zap, Shield, Star, Sparkles, X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { CancelSubscriptionFlow } from "@/components/premium/cancel-subscription-flow";

const FEATURES = [
  { icon: Zap, text: "Votes illimités" },
  { icon: Shield, text: "Sans publicités" },
  { icon: Star, text: "Memes exclusifs" },
  { icon: Sparkles, text: "Accès anticipé aux battles" },
  { icon: Crown, text: "Badge Premium" },
];

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey) {
      checkPremium();
    }
  }, [connected, publicKey]);

  const checkPremium = async () => {
    if (!supabase) {
      setIsPremium(false);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("status", "active")
      .single();

    setIsPremium(!!data);
  };

  const handleSubscribe = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour vous abonner",
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
      if (!user.user) {
        throw new Error("Utilisateur non connecté");
      }

      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user.id,
          walletAddress: publicKey.toString(),
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l&apos;abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (isPremium && supabase) {
      // Fetch user name for cancel dialog
      supabase.auth.getUser().then(({ data: user }) => {
        if (user.user) {
          supabase
            .from("profiles")
            .select("username")
            .eq("id", user.user.id)
            .single()
            .then(({ data }) => {
              if (data?.username) {
                setUserName(data.username);
              }
            });
        }
      });
    }
  }, [isPremium, supabase]);

  if (isPremium) {
    return (
      <>
        <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
          <div className="mb-8">
            <Crown className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Vous êtes Premium ! 👑
            </h1>
            <p className="text-muted-foreground">
              Profitez de tous les avantages exclusifs
            </p>
          </div>
          <Card className="glass-effect">
            <CardContent className="p-8 space-y-4">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-yellow-400" />
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler l&apos;abonnement
            </Button>
          </div>
        </div>
        <CancelSubscriptionFlow
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          userName={userName}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <Crown className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Passez Premium
        </h1>
        <p className="text-xl text-muted-foreground">
          Débloquez tous les avantages exclusifs
        </p>
      </div>

      <Card className="glass-effect max-w-2xl mx-auto border-yellow-500/30">
        <CardHeader className="text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-bold mb-4">
            🎁 ESSAI GRATUIT 3 JOURS
          </div>
          <div className="text-5xl font-bold mb-2">9.99€</div>
          <CardDescription className="text-lg">par mois après l&apos;essai</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <Icon className="h-5 w-5 text-purple-400" />
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm text-center text-muted-foreground">
              ✨ <strong>Essai gratuit 3 jours</strong> - Annulez à tout moment, aucun engagement
            </p>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading || !connected}
            className="w-full"
            size="lg"
            variant="neon"
          >
            <Crown className="mr-2 h-5 w-5" />
            {loading ? "Chargement..." : "Commencer l'essai gratuit →"}
          </Button>

          {!connected && (
            <p className="text-sm text-center text-muted-foreground">
              Connectez votre wallet pour vous abonner
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


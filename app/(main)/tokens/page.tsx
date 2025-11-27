"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, CreditCard, Coins, TrendingUp, Wallet, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SwapForm } from "@/components/swap/swap-form";
import Link from "next/link";

// Import Staking component (simplified)
function StakingSection() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Staking Tiers
          </CardTitle>
          <CardDescription>
            Stake $VOTE pour débloquer des avantages exclusifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Chad", amount: "1k", votes: "50/jour", boost: "20%", apr: "5%" },
              { name: "Diamond", amount: "10k", votes: "500/jour", boost: "50%", apr: "10%" },
              { name: "Whale", amount: "100k+", votes: "Illimité", boost: "100%", apr: "15%" },
            ].map((tier) => (
              <Card key={tier.name} className="border-purple-500/20">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stake {tier.amount} $VOTE
                  </p>
                  <div className="space-y-1 text-sm">
                    <div>Votes: {tier.votes}</div>
                    <div>Boost: {tier.boost}</div>
                    <div>APR: {tier.apr}</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    Stake Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payment methods for buying tokens
const PAYMENT_METHODS = [
  {
    id: "apple-pay",
    name: "Apple Pay",
    icon: "🍎",
    instant: true,
    minAmount: 20,
    maxAmount: 10000,
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: "P",
    instant: true,
    minAmount: 20,
    maxAmount: 5000,
  },
  {
    id: "revolut",
    name: "Revolut Pay",
    icon: "R",
    instant: true,
    minAmount: 20,
    maxAmount: 10000,
  },
  {
    id: "card",
    name: "Carte Bancaire",
    icon: "💳",
    instant: true,
    minAmount: 20,
    maxAmount: 5000,
  },
];

// Buy/Sell Section
function BuySellSection() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"buy" | "sell">("buy");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleAction = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast({
        title: activeAction === "buy" ? "Achat initié !" : "Vente initiée !",
        description: `${activeAction === "buy" ? "Achat" : "Vente"} de ${amount} $VOTE en cours...`,
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeAction === "buy" ? "default" : "outline"}
          onClick={() => setActiveAction("buy")}
          className="flex-1"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Acheter
        </Button>
        <Button
          variant={activeAction === "sell" ? "default" : "outline"}
          onClick={() => setActiveAction("sell")}
          className="flex-1"
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Vendre
        </Button>
      </div>

      {/* Payment Methods (only for buy) */}
      {activeAction === "buy" && (
        <div>
          <label className="text-sm font-medium mb-3 block">Méthode de paiement</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? "default" : "outline"}
                onClick={() => setSelectedMethod(method.id)}
                className="h-auto py-3 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-xs">{method.name}</span>
                {method.instant && (
                  <span className="text-xs text-green-400">⚡ Instant</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Card className="glass-effect border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeAction === "buy" ? (
              <>
                <CreditCard className="h-5 w-5 text-green-400" />
                Acheter $VOTE
              </>
            ) : (
              <>
                <ArrowUpDown className="h-5 w-5 text-red-400" />
                Vendre $VOTE
              </>
            )}
          </CardTitle>
          <CardDescription>
            {activeAction === "buy"
              ? "Achetez des tokens $VOTE avec votre carte bancaire (min. 20€)"
              : "Vendez vos tokens $VOTE et recevez l&apos;argent sur votre compte"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {activeAction === "buy" ? "Montant en EUR" : "Montant en $VOTE"}
            </label>
            <Input
              type="number"
              min={activeAction === "buy" ? "20" : "100"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={activeAction === "buy" ? "20" : "100"}
              className="text-lg"
            />
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Vous recevrez :</span>
              <span className="text-lg font-bold text-purple-400">
                {amount
                  ? activeAction === "buy"
                    ? `${(parseFloat(amount) * 10).toFixed(2)} $VOTE`
                    : `${(parseFloat(amount) / 10).toFixed(2)} €`
                  : "0"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Taux :</span>
              <span>{activeAction === "buy" ? "1€ = 10 $VOTE" : "10 $VOTE = 1€"}</span>
            </div>
          </div>

          <Button
            onClick={handleAction}
            disabled={loading || !amount || (activeAction === "buy" && (!selectedMethod || parseFloat(amount) < 20)) || (activeAction === "sell" && parseFloat(amount) < 100)}
            variant={activeAction === "buy" ? "neon" : "destructive"}
            className="w-full"
            size="lg"
          >
            {loading
              ? "Traitement..."
              : activeAction === "buy"
              ? selectedMethod
                ? `Acheter avec ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || "Carte"}`
                : "Sélectionnez une méthode de paiement"
              : "Vendre et Recevoir sur Compte"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TokensPage() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Tokens & Finance 💰
        </h1>
        <p className="text-muted-foreground">
          Swap, achetez, vendez et stakez vos tokens $VOTE
        </p>
      </div>

      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="swap" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Swap
          </TabsTrigger>
          <TabsTrigger value="buy-sell" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Buy/Sell
          </TabsTrigger>
          <TabsTrigger value="staking" className="gap-2">
            <Coins className="h-4 w-4" />
            Staking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swap">
          <Card className="glass-effect border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Swap de Tokens
              </CardTitle>
              <CardDescription>
                Utilisez Jupiter pour échanger SOL/USDC contre $VOTE
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connected && publicKey ? (
                <>
                  <SwapForm />
                  <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-muted-foreground">
                      💡 Fee de plateforme : 1% sur chaque swap
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <Coins className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Connectez votre wallet pour échanger des tokens
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buy-sell">
          {connected && publicKey ? (
            <BuySellSection />
          ) : (
            <Card className="glass-effect">
              <CardContent className="py-12 text-center">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connectez votre wallet pour acheter/vendre des tokens
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staking">
          {connected && publicKey ? (
            <StakingSection />
          ) : (
            <Card className="glass-effect">
              <CardContent className="py-12 text-center">
                <Coins className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connectez votre wallet pour staker vos tokens
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Market Stats */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Card className="glass-effect border-purple-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-purple-400 mb-2" />
            <p className="text-sm font-medium">Prix Actuel</p>
            <p className="text-lg font-bold">0.10€ / $VOTE</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-sm font-medium">Market Cap</p>
            <p className="text-lg font-bold">10M $VOTE</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Coins className="h-6 w-6 mx-auto text-green-400 mb-2" />
            <p className="text-sm font-medium">24h Volume</p>
            <p className="text-lg font-bold">500K $VOTE</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


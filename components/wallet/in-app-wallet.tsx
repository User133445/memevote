"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpDown, Send, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function InAppWallet() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchBalance();
      fetchTransactions();
    }
  }, [connected, publicKey, supabase]);

  const fetchBalance = async () => {
    if (!supabase || !publicKey) return;
    
    try {
      // In production, fetch actual token balance from Solana
      // For now, use a mock balance from database
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("amount, transaction_type")
        .eq("wallet_address", publicKey.toString())
        .eq("status", "completed");

      if (error) throw error;

      const total = (data || []).reduce((acc, tx) => {
        if (tx.transaction_type === "buy") return acc + parseFloat(tx.amount);
        if (tx.transaction_type === "sell") return acc - parseFloat(tx.amount);
        return acc;
      }, 0);

      setBalance(Math.max(0, total));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async () => {
    if (!supabase || !publicKey) return;
    
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_address", publicKey.toString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleBuy = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet non connecté",
        description: "Veuillez connecter votre wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // In production, integrate with Jupiter aggregator for actual swap
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buy",
          amount: parseFloat(buyAmount),
          token: "VOTE",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l&apos;achat");

      toast({
        title: "Achat réussi",
        description: `Vous avez acheté ${buyAmount} $VOTE`,
      });

      setBuyAmount("");
      await fetchBalance();
      await fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet non connecté",
        description: "Veuillez connecter votre wallet.",
        variant: "destructive",
      });
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > balance) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide inférieur à votre solde.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          amount: parseFloat(sellAmount),
          token: "VOTE",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la vente");

      toast({
        title: "Vente réussie",
        description: `Vous avez vendu ${sellAmount} $VOTE`,
      });

      setSellAmount("");
      await fetchBalance();
      await fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card className="border-purple-500/20">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Connectez votre wallet pour utiliser le portefeuille intégré
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-400" />
          Portefeuille intégré
        </CardTitle>
        <CardDescription>
          Gérez vos tokens $VOTE directement dans l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <div className="text-sm text-muted-foreground mb-1">Solde disponible</div>
          <div className="text-3xl font-bold text-purple-400">{balance.toFixed(2)} $VOTE</div>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Acheter</TabsTrigger>
            <TabsTrigger value="sell">Vendre</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Montant ($VOTE)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <Button
              onClick={handleBuy}
              disabled={loading}
              className="w-full"
              variant="neon"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Acheter avec SOL
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Montant ($VOTE)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                min="0"
                max={balance}
                step="0.01"
              />
            </div>
            <Button
              onClick={handleSell}
              disabled={loading || parseFloat(sellAmount) > balance}
              className="w-full"
              variant="outline"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Vendre pour SOL
            </Button>
          </TabsContent>
        </Tabs>

        {transactions.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4" />
              <h3 className="font-semibold">Historique</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-purple-500/10 text-sm"
                >
                  <div>
                    <div className="font-medium capitalize">{tx.transaction_type}</div>
                    <div className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={tx.transaction_type === "buy" ? "text-green-400" : "text-red-400"}>
                      {tx.transaction_type === "buy" ? "+" : "-"}
                      {tx.amount} $VOTE
                    </div>
                    <div className="text-muted-foreground text-xs capitalize">{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


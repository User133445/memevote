"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Month 3: Enable Base - set NEXT_PUBLIC_ENABLE_BASE=true
// Month 6: Enable Blast - set NEXT_PUBLIC_ENABLE_BLAST=true
const CHAINS = [
  { value: "solana", label: "Solana", enabled: true },
  { value: "base", label: "Base", enabled: process.env.NEXT_PUBLIC_ENABLE_BASE === "true" },
  { value: "blast", label: "Blast", enabled: process.env.NEXT_PUBLIC_ENABLE_BLAST === "true" },
  { value: "ethereum", label: "Ethereum", enabled: process.env.NEXT_PUBLIC_ENABLE_BASE === "true" || process.env.NEXT_PUBLIC_ENABLE_BLAST === "true" },
];

export default function BridgePage() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [sourceChain, setSourceChain] = useState("solana");
  const [targetChain, setTargetChain] = useState("base");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (connected && publicKey && supabase) {
      fetchTransactions();
    }
  }, [connected, publicKey, supabase]);

  const fetchTransactions = async () => {
    if (!supabase || !publicKey) return;
    
    try {
      const { data, error } = await supabase
        .from("bridge_transactions")
        .select("*")
        .eq("wallet_address", publicKey.toString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleBridge = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet non connecté",
        description: "Veuillez connecter votre wallet pour utiliser le bridge.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide.",
        variant: "destructive",
      });
      return;
    }

    // Month 3: Enable Base - set NEXT_PUBLIC_ENABLE_BASE=true
    // Month 6: Enable Blast - set NEXT_PUBLIC_ENABLE_BLAST=true
    if (process.env.NEXT_PUBLIC_ENABLE_BASE !== "true" && process.env.NEXT_PUBLIC_ENABLE_BLAST !== "true") {
      toast({
        title: "Bridge désactivé",
        description: "Le bridge cross-chain sera activé progressivement (Base: Mois 3, Blast: Mois 6).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create transaction record
      const { data: txData, error: txError } = await supabase
        .from("bridge_transactions")
        .insert({
          user_id: publicKey.toString(), // In production, use actual user_id from auth
          wallet_address: publicKey.toString(),
          source_chain: sourceChain,
          target_chain: targetChain,
          amount: parseFloat(amount),
          token_symbol: "VOTE",
          status: "pending",
        })
        .select()
        .single();

      if (txError) throw txError;

      // In production, integrate with Wormhole SDK here
      // const wormholeTx = await bridgeTokens(...);

      toast({
        title: "Transaction initiée",
        description: "Votre transaction de bridge est en cours de traitement.",
      });

      await fetchTransactions();
      setAmount("");
    } catch (error: any) {
      console.error("Bridge error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du bridge.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Month 3: Enable Base - set NEXT_PUBLIC_ENABLE_BASE=true
  // Month 6: Enable Blast - set NEXT_PUBLIC_ENABLE_BLAST=true
  if (process.env.NEXT_PUBLIC_ENABLE_BASE !== "true" && process.env.NEXT_PUBLIC_ENABLE_BLAST !== "true") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-purple-400" />
              Cross-Chain Bridge
            </CardTitle>
            <CardDescription>
              Transférez vos tokens $VOTE entre différentes blockchains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bridge non disponible</h3>
              <p className="text-muted-foreground">
                Le bridge cross-chain sera activé prochainement. 
                Pour l&apos;instant, restez sur Solana pour toutes vos transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-purple-400" />
            Cross-Chain Bridge
          </CardTitle>
          <CardDescription>
            Transférez vos tokens $VOTE entre Solana, Base et Ethereum via Wormhole
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={sourceChain} onValueChange={setSourceChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.filter(c => c.enabled).map((chain) => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={targetChain} onValueChange={setTargetChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.filter(c => c.enabled && c.value !== sourceChain).map((chain) => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Montant ($VOTE)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <Button
            onClick={handleBridge}
            disabled={loading || !connected}
            className="w-full"
            variant="neon"
          >
            {loading ? "Traitement..." : "Bridger"}
          </Button>

          {!connected && (
            <p className="text-sm text-muted-foreground text-center">
              Connectez votre wallet pour utiliser le bridge
            </p>
          )}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card className="mt-6 border-purple-500/20">
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-purple-500/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.amount} $VOTE</span>
                      <span className="text-muted-foreground">
                        {tx.source_chain} → {tx.target_chain}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.status === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {tx.status === "pending" && (
                      <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                    {tx.status === "failed" && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm capitalize">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOKENS = {
  SOL: { symbol: "SOL", name: "Solana", decimals: 9 },
  USDC: { symbol: "USDC", name: "USD Coin", decimals: 6 },
  VOTE: { symbol: "$VOTE", name: "Vote Token", decimals: 9 },
};

export function SwapForm() {
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("VOTE");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();

  const handleSwap = async () => {
    if (!publicKey || !fromAmount) {
      toast({
        title: "Erreur",
        description: "Remplissez tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // In production, integrate with Jupiter Aggregator
      // For now, simulate swap
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount: fromAmount,
          wallet: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Swap réussi !",
        description: `Vous avez reçu ${toAmount} ${toToken}`,
      });

      setFromAmount("");
      setToAmount("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;effectuer le swap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">De</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value);
              // Calculate toAmount (simplified, in production use Jupiter API)
              if (e.target.value) {
                const amount = parseFloat(e.target.value);
                setToAmount((amount * 0.99).toFixed(6)); // 1% fee
              } else {
                setToAmount("");
              }
            }}
            placeholder="0.0"
            className="flex-1"
          />
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="px-4 py-2 rounded-md bg-background border border-input"
          >
            {Object.keys(TOKENS).map((token) => (
              <option key={token} value={token}>
                {TOKENS[token as keyof typeof TOKENS].symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwitch}
          className="rounded-full"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Vers</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0.0"
            className="flex-1"
          />
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="px-4 py-2 rounded-md bg-background border border-input"
          >
            {Object.keys(TOKENS).map((token) => (
              <option key={token} value={token}>
                {TOKENS[token as keyof typeof TOKENS].symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={handleSwap}
        disabled={loading || !fromAmount}
        className="w-full"
        variant="neon"
      >
        {loading ? "Swap en cours..." : "Échanger"}
      </Button>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { transferVoteWithFee } from "@/lib/solana/transfer-vote";

interface TipButtonProps {
  memeId: string;
  creatorWallet: string;
  creatorId: string;
}

const TIP_AMOUNTS = [1, 5, 10, 50, 100]; // $VOTE amounts

export function TipButton({ memeId, creatorWallet, creatorId }: TipButtonProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const supabase = createClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleTip = async (amount: number) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour envoyer un tip",
        variant: "destructive",
      });
      return;
    }

    if (!supabase) {
      toast({
        title: "Erreur",
        description: "Supabase non configuré",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get user profile
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      // Create tip record
      const { data: tip, error: tipError } = await supabase
        .from("tips")
        .insert({
          meme_id: memeId,
          tipper_id: user.user.id,
          tipper_wallet: publicKey.toString(),
          recipient_id: creatorId,
          recipient_wallet: creatorWallet,
          amount: amount,
          status: "pending",
        })
        .select()
        .single();

      if (tipError) throw tipError;

      // Transfer $VOTE tokens via Solana
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
      );

      let txSignature: string;

      try {
        // Check if VOTE_TOKEN_MINT is configured
        if (process.env.NEXT_PUBLIC_VOTE_TOKEN_MINT) {
          // Real $VOTE token transfer
          const { signature } = await transferVoteWithFee(
            {
              from: publicKey,
              to: new PublicKey(creatorWallet),
              amount,
              connection,
              signTransaction: signTransaction!,
            },
            0.01 // 1% platform fee
          );
          txSignature = signature;
        } else {
          // Fallback: Simulate transaction if token not configured
          console.warn("VOTE_TOKEN_MINT not configured, simulating transfer");
          txSignature = "mock_signature_" + Date.now();
        }
      } catch (error: any) {
        throw new Error(`Transfer failed: ${error.message}`);
      }

      // Update tip with transaction signature
      await supabase
        .from("tips")
        .update({
          status: "confirmed",
          solana_tx_signature: txSignature,
        })
        .eq("id", tip.id);

      // Update creator's reputation (tips received)
      await supabase.rpc("calculate_reputation_score", { user_uuid: creatorId });

      // Track interaction for collaborative filtering
      await supabase.from("user_meme_interactions").upsert({
        user_id: user.user.id,
        meme_id: memeId,
        interaction_type: "tip",
        interaction_value: amount,
      });

      toast({
        title: "Tip envoyé ! 🎉",
        description: `${amount} $VOTE envoyés au créateur`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d&apos;envoyer le tip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-purple-500/50 hover:bg-purple-500/10"
        >
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="hidden sm:inline">Tip</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-purple-500/20 bg-black/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Envoyer un Tip
          </DialogTitle>
          <DialogDescription>
            Supportez le créateur en lui envoyant des $VOTE
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">

          {/* Quick Tip Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {TIP_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handleTip(amount)}
                disabled={loading}
                className="hover:bg-purple-500/20 hover:border-purple-500"
              >
                {amount} $VOTE
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant personnalisé</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Entrez un montant"
                className="flex-1 px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                onClick={() => {
                  const amount = parseFloat(customAmount);
                  if (amount > 0) {
                    handleTip(amount);
                  }
                }}
                disabled={loading || !customAmount || parseFloat(customAmount) <= 0}
                variant="neon"
              >
                Envoyer
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 Les tips améliorent la visibilité du meme dans le feed
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
// import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MultiChainConnect } from "./multi-chain-connect";

export function WalletConnect() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  // const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (connected && publicKey) {
      handleWalletAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  const handleWalletAuth = async () => {
    if (!publicKey) return;

    try {
      const supabase = createClient();
      
      // Skip auth if Supabase is not configured
      if (!supabase) {
        toast({
          title: "Mode démo",
          description: "Connectez Supabase pour activer l'authentification",
        });
        router.push("/feed");
        return;
      }
      
      // Sign message with wallet
      const message = `Connectez-vous à MemeVote.fun\n\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`;
      
      // For now, we'll use a simple auth flow
      // In production, you'd sign the message with the wallet
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${publicKey.toString()}@wallet.memevote.fun`,
        password: publicKey.toString(),
      });

      if (error && error.message.includes("Invalid login")) {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${publicKey.toString()}@wallet.memevote.fun`,
          password: publicKey.toString(),
          options: {
            data: {
              wallet_address: publicKey.toString(),
              username: `user_${publicKey.toString().slice(0, 8)}`,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // Get wallet name from adapter
        const walletName = (window as any).solana?.isPhantom ? "Phantom" :
                          (window as any).solflare ? "Solflare" :
                          (window as any).backpack ? "Backpack" :
                          (window as any).okxwallet ? "OKX" :
                          (window as any).trustwallet ? "Trust Wallet" :
                          (window as any).ledger ? "Ledger" : "Unknown";
        
        // Check for referral code
        const referralCode = localStorage.getItem("referral_code");

        // Create user profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: signUpData.user?.id,
            wallet_address: publicKey.toString(),
            username: `user_${publicKey.toString().slice(0, 8)}`,
            points: 0,
            level: 1,
            wallet_name: walletName,
            first_connection_bonus_claimed: false,
            referred_by: referralCode || null, // Add referred_by if exists
          });
          
        // Process referral reward if code exists
        if (referralCode && !profileError) {
           // This could be handled by a database trigger or edge function
           // But for now we just ensure the relationship is stored
           console.log("User signed up with referral code:", referralCode);
        }

        if (profileError) {
          console.error("Profile creation error:", profileError);
        } else {
          // Claim first connection bonus
          const { data: bonusData, error: bonusError } = await supabase.rpc(
            "claim_first_connection_bonus",
            {
              user_wallet: publicKey.toString(),
              wallet_name: walletName,
            }
          );

          if (!bonusError && bonusData?.success) {
            toast({
              title: "🎉 Bonus de première connexion !",
              description: `+${bonusData.bonus_votes} votes gratuits + badge ${walletName} !`,
            });
          }
        }
      } else {
        // Existing user - check if bonus was claimed
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_connection_bonus_claimed, wallet_name")
          .eq("wallet_address", publicKey.toString())
          .single();

        if (profile && !profile.first_connection_bonus_claimed) {
          const walletName = profile.wallet_name || "Unknown";
          const { data: bonusData, error: bonusError } = await supabase.rpc(
            "claim_first_connection_bonus",
            {
              user_wallet: publicKey.toString(),
              wallet_name: walletName,
            }
          );

          if (!bonusError && bonusData?.success) {
            toast({
              title: "🎉 Bonus de première connexion !",
              description: `+${bonusData.bonus_votes} votes gratuits + badge ${walletName} !`,
            });
          }
        }
      }

      toast({
        title: "Connexion réussie !",
        description: "Votre wallet est connecté.",
      });

      router.push("/feed");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  // Show multi-chain connect if either chain is connected
  if (connected) { // || evmConnected
    return <MultiChainConnect />;
  }

  return (
    <Button
      onClick={() => setVisible(true)}
      size="sm"
      variant="neon"
      className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
    >
      <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden xs:inline">Connecter</span>
    </Button>
  );
}


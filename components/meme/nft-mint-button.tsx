"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon } from "lucide-react";

interface NFTMintButtonProps {
  memeId: string;
  memeTitle: string;
  memeUrl: string;
  disabled?: boolean;
}

export function NFTMintButton({
  memeId,
  memeTitle,
  memeUrl,
  disabled,
}: NFTMintButtonProps) {
  const [minting, setMinting] = useState(false);
  const { publicKey, connected, signTransaction } = useWallet();
  const { toast } = useToast();

  const handleMint = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet requis",
        description: "Connectez votre wallet pour mint",
        variant: "destructive",
      });
      return;
    }

    setMinting(true);

    try {
      // In production, use Metaplex to mint NFT
      const response = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeId,
          memeTitle,
          memeUrl,
          wallet: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "NFT minté !",
        description: `Votre NFT est disponible à l&apos;adresse ${data.nftAddress}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mint le NFT",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  return (
    <Button
      onClick={handleMint}
      disabled={minting || disabled}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <ImageIcon className="h-4 w-4" />
      {minting ? "Mint en cours..." : "Mint NFT"}
    </Button>
  );
}


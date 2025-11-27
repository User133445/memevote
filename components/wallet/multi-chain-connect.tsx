"use client";

import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

// Custom hooks that safely call wagmi hooks
function useSafeAccount() {
  const [account, setAccount] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const wagmi = require("wagmi");
      const { useAccount } = wagmi;
      // We can't call hooks conditionally, so we'll use a different approach
      // For now, we'll just return null and handle EVM connection differently
    } catch (e) {
      // Wagmi not available
    }
  }, []);
  
  return account;
}

function useSafeDisconnect() {
  const [disconnect, setDisconnect] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const wagmi = require("wagmi");
      // Similar approach - we'll handle this differently
    } catch (e) {
      // Wagmi not available
    }
  }, []);
  
  return disconnect;
}

function useSafeConnect() {
  const [connect, setConnect] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const wagmi = require("wagmi");
      // Similar approach - we'll handle this differently
    } catch (e) {
      // Wagmi not available
    }
  }, []);
  
  return connect;
}

export function MultiChainConnect() {
  const { publicKey, disconnect: disconnectSolana, connected: solanaConnected } = useSolanaWallet();
  
  // For now, we'll only support Solana wallet connection
  // EVM support can be added later with proper hook handling
  const evmAddress = null;
  const evmConnected = false;
  const disconnectEvm = null;
  const connectEvm = () => {
    // EVM connection will be handled separately
    console.log("EVM connection not yet implemented");
  };

  return (
    <div className="flex items-center gap-2">
      {solanaConnected && publicKey && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            SOL: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
          <Button
            onClick={() => disconnectSolana()}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      )}
      {evmConnected && evmAddress && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            EVM: {evmAddress.slice(0, 4)}...{evmAddress.slice(-4)}
          </span>
          {disconnectEvm && (
            <Button
              onClick={disconnectEvm}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      {!solanaConnected && !evmConnected && (
        <Button
          onClick={connectEvm}
          variant="neon"
          size="sm"
          className="gap-2"
        >
          <Wallet className="h-4 w-4" />
          Connect
        </Button>
      )}
    </div>
  );
}

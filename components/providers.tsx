"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolongWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
} from "@solana/wallet-adapter-wallets";
// Month 3: Enable Base - set ENABLE_BASE=true
// Month 6: Enable Blast - set ENABLE_BLAST=true
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, useState } from "react";
// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Wagmi configuration (lazy load to avoid SSR issues)
let wagmiConfig: any = null;
let wagmiQueryClient: any = null;

if (typeof window !== "undefined") {
  try {
    const { WagmiProvider, createConfig, http } = require("wagmi");
    const { base, blast, mainnet } = require("wagmi/chains");
    const { walletConnect, metaMask, coinbaseWallet, injected } = require("wagmi/connectors");
    const { QueryClient: WagmiQueryClient } = require("@tanstack/react-query");

    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

    const connectors = [
      injected({ shimDisconnect: true }),
      metaMask({ dappMetadata: { name: "MemeVote.fun" } }),
      coinbaseWallet({ appName: "MemeVote.fun" }),
    ];

    if (projectId) {
      connectors.push(walletConnect({ projectId }));
    }

    // Month 3: Enable Base - set NEXT_PUBLIC_ENABLE_BASE=true
    // Month 6: Enable Blast - set NEXT_PUBLIC_ENABLE_BLAST=true
    const enabledChains = [mainnet];
    const enabledTransports: any = { [mainnet.id]: http() };
    
    if (process.env.NEXT_PUBLIC_ENABLE_BASE === "true") {
      enabledChains.push(base);
      enabledTransports[base.id] = http();
    }
    
    if (process.env.NEXT_PUBLIC_ENABLE_BLAST === "true") {
      enabledChains.push(blast);
      enabledTransports[blast.id] = http();
    }

    wagmiConfig = createConfig({
      chains: enabledChains,
      connectors,
      transports: enabledTransports,
    });

    wagmiQueryClient = new WagmiQueryClient();
  } catch (e) {
    console.warn("Wagmi not available, EVM chains disabled");
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  // MANDATORY: Most popular wallets
  // Priority: Phantom (#1), Solflare (#2), Backpack (#3), Trust, Ledger, etc.
  const wallets = useMemo(
    () => {
      const walletList = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new LedgerWalletAdapter(),
      ];

      // Try to add popular wallets dynamically
      try {
        const { BackpackWalletAdapter } = require("@solana/wallet-adapter-backpack");
        walletList.push(new BackpackWalletAdapter());
      } catch (e) { /* ignore */ }

      try {
        const { TrustWalletAdapter } = require("@solana/wallet-adapter-trust");
        walletList.push(new TrustWalletAdapter());
      } catch (e) { /* ignore */ }

      // Add standard adapters
      walletList.push(
        new TorusWalletAdapter(),
        new SolongWalletAdapter(),
        new MathWalletAdapter(),
        new Coin98WalletAdapter()
      );

      // Optional: Add WalletConnect for Rabby/Metamask (Solana Snap) support if needed in future
      
      return walletList;
    },
    []
  );

  // Lazy load WagmiProvider to avoid SSR issues
  const WagmiProviderComponent = useMemo(() => {
    if (!wagmiConfig) {
      const EmptyProvider = ({ children }: any) => <>{children}</>;
      EmptyProvider.displayName = "EmptyProvider";
      return EmptyProvider;
    }
    try {
      const wagmi = require("wagmi");
      return wagmi.WagmiProvider;
    } catch (e) {
      const EmptyProvider = ({ children }: any) => <>{children}</>;
      EmptyProvider.displayName = "EmptyProvider";
      return EmptyProvider;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProviderComponent config={wagmiConfig} queryClient={wagmiQueryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProviderComponent>
    </QueryClientProvider>
  );
}

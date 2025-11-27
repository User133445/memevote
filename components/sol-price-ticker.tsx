"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

export function SolPriceTicker() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let lastFetch = 0;
    const MIN_INTERVAL = 60000; // 1 minute minimum between fetches

    const fetchPrice = async () => {
      const now = Date.now();
      if (now - lastFetch < MIN_INTERVAL) return; // Rate limit
      
      lastFetch = now;
      
      try {
        // Use Next.js API route to avoid CORS issues
        const response = await fetch("/api/sol-price", {
          cache: "no-store",
        });
        
        if (!response.ok) {
          // Fallback to static price if API fails
          if (mounted) setPrice(150); // Default SOL price
          return;
        }
        
        const data = await response.json();
        if (mounted && data.price) {
          setPrice(data.price);
        }
              } catch (e) {
                // Silently fail - don't spam console
                // Fallback to static price
                if (mounted) setPrice(150);
              }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 120000); // Update every 2 minutes (reduced frequency)
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!price) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono font-bold mr-4 animate-pulse">
      <TrendingUp className="h-3 w-3" />
      SOL: ${price.toFixed(2)}
    </div>
  );
}


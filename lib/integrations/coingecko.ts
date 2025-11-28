"use client";

import { useState, useEffect } from "react";

interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export function useCryptoPrices() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch Solana and USDC prices
        // Note: Free API has rate limits (approx 10-30 calls/min)
        const response = await fetch(
          `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=solana,usd-coin&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }

        const data = await response.json();
        const priceMap: Record<string, TokenPrice> = {};
        
        data.forEach((coin: any) => {
          priceMap[coin.id] = coin;
        });

        // Add mock $VOTE price (since it's not on CG yet)
        priceMap["vote-token"] = {
          id: "vote-token",
          symbol: "vote",
          name: "MemeVote",
          current_price: 0.0015, // Fixed mock price
          price_change_percentage_24h: 5.2,
          image: "/favicon.svg"
        };

        setPrices(priceMap);
      } catch (err: any) {
        setError(err.message);
        console.error("CoinGecko API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    // Refresh every 5 minutes to respect rate limits
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { prices, loading, error };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(value);
}


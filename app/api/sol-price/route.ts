import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Proxy request to CoinGecko to avoid CORS issues
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "MemeVote/1.0",
        },
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      console.warn("CoinGecko API returned non-OK status:", response.status);
      // Return default price on error
      return NextResponse.json({ price: 150 }, { status: 200 });
    }

    const data = await response.json();
    const price = data.solana?.usd || 150;

    return NextResponse.json({ price }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch SOL price:", error);
    // Return default price on error - always return 200 to prevent client errors
    return NextResponse.json({ price: 150 }, { status: 200 });
  }
}


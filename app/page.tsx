"use client";

import { CompactHero } from "@/components/home/compact-hero";
import { UnifiedFeedPage } from "@/components/feed/unified-feed-page";
import { Navbar } from "@/components/navbar";
import { Chatbot } from "@/components/chatbot/chatbot";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CompactHero />
        <UnifiedFeedPage />
      </main>
      <Chatbot />
    </div>
  );
}


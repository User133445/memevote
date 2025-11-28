"use client";

import { UnifiedFeedPage } from "@/components/feed/unified-feed-page";
import { Navbar } from "@/components/navbar";
import { Chatbot } from "@/components/chatbot/chatbot";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <UnifiedFeedPage />
      </main>
      <Footer />
      <Chatbot />
      <FloatingActionButton />
    </div>
  );
}


"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Link 
      href="/" 
      className={`flex items-center gap-3 ${className || ""}`}
    >
      <div className="relative w-12 h-12 flex-shrink-0 hover:scale-110 transition-transform">
        <Image
          src="/favicon.svg"
          alt="MemeVote.fun"
          width={48}
          height={48}
          className="w-12 h-12 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent tracking-tight leading-none">
          MemeVote.fun
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
          Vote, Earn, Go Viral 🚀
        </span>
      </div>
    </Link>
  );
}

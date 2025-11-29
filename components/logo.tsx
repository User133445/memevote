"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Link 
      href="/" 
      className={`flex items-center gap-3 ${className || ""}`}
    >
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 hover:scale-110 transition-transform">
        <Image
          src="/favicon.svg"
          alt="MemeVote.fun"
          width={48}
          height={48}
          className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent tracking-tight leading-none">
          MemeVote.fun
        </span>
        <span className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
          Vote, Earn, Go Viral 🚀
        </span>
      </div>
    </Link>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { Logo } from "@/components/logo";
import { SolPriceTicker } from "@/components/sol-price-ticker";
import { PayoutCountdown } from "@/components/payout-countdown";
import {
  Home,
  Upload,
  Menu,
  Search,
  LogIn,
  Mail,
  Twitter,
  Apple,
  MoreHorizontal,
  MessageCircle,
  Sparkles,
  Heart,
  Target,
  Swords,
  ArrowLeftRight,
  CreditCard,
  Globe,
  Map,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

// Menu simplifié - Tout est maintenant sur la page d'accueil avec onglets
const mainNav = [
  { href: "/", label: "Home", icon: Home }, // Page principale avec onglets For You | Feed
];

// Menu "More" (Tout le reste) - OPTIMISÉ ET ORGANISÉ
// Note: Upload est maintenant un popup sur la page d'accueil, pas besoin de lien séparé
const moreNav = [
  // Création & Contenu
  { href: "/battles", label: "Battles", icon: SwordsIcon, category: "create" },
  { href: "/rankings", label: "Rankings", icon: TrophyIcon, category: "create" },
  
  // Social & Communauté
  { href: "/following", label: "Following", icon: HeartIcon, category: "social" },
  { href: "/messages", label: "Messages", icon: MessageCircle, category: "social" },
  { href: "/badges", label: "Badges", icon: TrophyIcon, category: "social" },
  
  // Finance & Tokens
  { href: "/tokens", label: "Tokens", icon: CoinsIcon, category: "finance" },
  { href: "/bridge", label: "Bridge", icon: GlobeIcon, category: "finance" },
  { href: "/quests", label: "Quests", icon: TargetIcon, category: "finance" },
  
  // Premium & Références
  { href: "/premium", label: "Premium", icon: CrownIcon, category: "premium" },
  { href: "/refer", label: "Referrals", icon: UsersIcon, category: "premium" },
  
  // Paramètres
  { href: "/settings", label: "Settings", icon: LayoutDashboardIcon, category: "settings" },
];

// Icons helper
function CrownIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg> }
function TrendingUpIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function TrophyIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17"/><path d="M14 14.66V17"/><path d="M18 2h-5.5a5.5 5.5 0 0 0-5.5 5.5V11l2.5 3.5h6L18 11V7.5A5.5 5.5 0 0 0 12.5 2"/></svg> }
function CoinsIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg> }
function UsersIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function HeartIcon(props: any) { return <Heart {...props} className="h-4 w-4" /> }
function TargetIcon(props: any) { return <Target {...props} className="h-4 w-4" /> }
function SwordsIcon(props: any) { return <Swords {...props} className="h-4 w-4" /> }
function ArrowLeftRightIcon(props: any) { return <ArrowLeftRight {...props} className="h-4 w-4" /> }
function CreditCardIcon(props: any) { return <CreditCard {...props} className="h-4 w-4" /> }
function GlobeIcon(props: any) { return <Globe {...props} className="h-4 w-4" /> }
function MapIcon(props: any) { return <Map {...props} className="h-4 w-4" /> }
function LayoutDashboardIcon(props: any) { return <LayoutDashboard {...props} className="h-4 w-4" /> }

export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-purple-500/20 backdrop-blur-xl bg-black/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
           {/* Left: Logo + Ticker + Countdown */}
           <div className="flex items-center gap-4">
             <Logo />
             <div className="hidden lg:flex items-center gap-3">
                <SolPriceTicker />
                <PayoutCountdown />
             </div>
           </div>

          {/* Center: Search & Nav (Desktop) */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search memes, creators, tags..." 
                className="w-full bg-white/5 border-white/10 pl-9 h-9 text-sm focus:bg-black/80 transition-all rounded-full"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
             
             {/* Main Nav Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={item.variant === "neon" ? "neon" : (isActive ? "secondary" : "ghost")}
                      size={item.variant === "neon" ? "default" : "sm"}
                      className={cn(
                        "gap-2 font-bold",
                        item.variant === "neon" && "shadow-lg shadow-purple-500/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-effect border-purple-500/20 bg-black/90">
                  <DropdownMenuLabel className="text-xs text-purple-400/70 uppercase">Création</DropdownMenuLabel>
                  {moreNav.filter((item: any) => item.category === "create").map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-blue-400/70 uppercase">Communauté</DropdownMenuLabel>
                  {moreNav.filter((item: any) => item.category === "social").map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-green-400/70 uppercase">Finance</DropdownMenuLabel>
                  {moreNav.filter((item: any) => item.category === "finance").map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-yellow-400/70 uppercase">Premium</DropdownMenuLabel>
                  {moreNav.filter((item: any) => item.category === "premium").map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {moreNav.filter((item: any) => item.category === "settings").map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Login / Wallet */}
            <div className="flex items-center gap-2">
              {!connected && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="hidden sm:flex gap-2 font-bold">
                      <LogIn className="h-4 w-4" />
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-effect border-purple-500/20 sm:max-w-md bg-black/95">
                    <DialogHeader>
                      <DialogTitle className="text-center text-2xl font-bold mb-2">Welcome to MemeVote</DialogTitle>
                      <DialogDescription className="text-center">
                        Connectez-vous pour commencer à voter et gagner
                      </DialogDescription>
                      <div className="flex justify-center mb-6">
                        <Logo />
                      </div>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-black px-2 text-muted-foreground">Login with</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="gap-2 hover:bg-white/5">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/></svg>
                          Google
                        </Button>
                        <a href="https://x.com/memevotefun" target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button variant="outline" className="gap-2 hover:bg-white/5 w-full">
                            <Twitter className="h-5 w-5 text-blue-400" />
                            Twitter
                          </Button>
                        </a>
                        <Button variant="outline" className="gap-2 hover:bg-white/5">
                          <Apple className="h-5 w-5" />
                          Apple
                        </Button>
                        <Button variant="outline" className="gap-2 hover:bg-white/5">
                          <Mail className="h-5 w-5 text-purple-400" />
                          Email
                        </Button>
                      </div>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-black px-2 text-muted-foreground">Or connect wallet</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <WalletConnect />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Wallet Button (Only one!) */}
              <WalletConnect />
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-effect border-l border-purple-500/20 bg-black/95 w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-purple-500/20">
                    <Logo />
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto">
                     <div className="space-y-2">
                        <div className="px-2 text-xs font-bold text-muted-foreground uppercase mb-2">Menu</div>
                        {mainNav.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-lg">
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        ))}
                        {moreNav.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-lg">
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        ))}
                     </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>
    </nav>
  );
}

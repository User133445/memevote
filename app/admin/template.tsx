"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  FileImage, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/");
        return;
      }

      // Check if user has Admin badge
      // In a real app, you might want a more robust role system
      // For now, we check the badge or a specific hardcoded wallet for safety
      const { data: profile } = await supabase
        .from("profiles")
        .select("badge, wallet_address")
        .eq("id", user.id)
        .single();

      const isAdminUser = profile?.badge === "Admin" || 
                          // Fallback for first admin setup
                          profile?.wallet_address === process.env.NEXT_PUBLIC_ADMIN_WALLET;

      if (!isAdminUser) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits d'administration.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin check error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { href: "/admin", label: "Vue d'ensemble", icon: BarChart3 },
    { href: "/admin/moderation", label: "Modération", icon: FileImage },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/feedback", label: "Feedbacks", icon: MessageSquare },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-zinc-900/50 flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-white/10">
          <Shield className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold tracking-tight">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-3"
            onClick={() => router.push("/")}
          >
            <LogOut className="h-5 w-5" />
            Retour au site
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black relative">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


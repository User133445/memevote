"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Twitter, 
  Mail, 
  FileText, 
  Shield, 
  HelpCircle,
  MessageSquare,
  Rocket
} from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-purple-500/20 bg-black/50 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Plateforme virale de vote de memes avec récompenses play-to-earn.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/memevotefun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-purple-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@memevote.fun"
                className="text-muted-foreground hover:text-purple-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/feed" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Feed
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/battles" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Battles
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold mb-4">Commencer</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Rejoignez la communauté et commencez à gagner dès aujourd&apos;hui !
            </p>
            <Button
              variant="neon"
              size="sm"
              className="w-full"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent('open-upload-dialog'));
                }
              }}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Start Free
            </Button>
          </div>
        </div>

        <div className="border-t border-purple-500/20 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MemeVote.fun. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}


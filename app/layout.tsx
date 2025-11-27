import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MemeVote.fun - Votez, Gagnez, Devenez Viral 🚀",
  description: "Plateforme virale de vote de memes avec récompenses play-to-earn en tokens $VOTE sur Solana. Partagez vos memes, votez, et gagnez de l'argent !",
  keywords: ["meme", "vote", "solana", "crypto", "nft", "viral", "tiktok", "reddit", "pump.fun"],
  authors: [{ name: "MemeVote.fun" }],
  openGraph: {
    title: "MemeVote.fun - Votez, Gagnez, Devenez Viral",
    description: "Plateforme virale de vote de memes avec récompenses play-to-earn",
    type: "website",
    locale: "fr_FR",
    url: "https://memevote.fun",
    siteName: "MemeVote.fun",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemeVote.fun",
    description: "Votez pour les meilleurs memes et gagnez des récompenses !",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: "#8b5cf6",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(() => console.log('SW registered'))
                    .catch(() => console.log('SW registration failed'));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

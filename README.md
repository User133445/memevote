# MemeVote.fun 🚀

Plateforme virale de vote de memes avec récompenses play-to-earn en tokens $VOTE sur Solana.

## 🎯 Features Principales

- 🔐 Authentification par wallet Solana (7 wallets supportés)
- 📤 Upload de memes (images, GIFs, vidéos)
- 📊 Feed infini style TikTok avec auto-play
- ⬆️ Système de vote (upvote/downvote) avec rate limiting
- 🏆 Leaderboard quotidien/hebdomadaire/global
- 💰 Staking de $VOTE avec récompenses (5-15% APR)
- 🎁 Système d'affiliation et referral (10% des fees)
- 💎 Abonnement Premium (9.99€/mois, 3 jours d'essai gratuit)
- ⚔️ Battles en direct (1v1 meme duels)
- 🎨 Mint NFT pour les memes gagnants
- 📈 Analytics dashboard
- 💬 Chats communautaires en temps réel
- 🔄 Swap de tokens in-app (Jupiter)
- 🌉 Bridge cross-chain (Solana/Base/Blast via Wormhole)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Storage, Auth, Realtime, Edge Functions)
- **Blockchain**: Solana (web3.js, Wallet Adapter)
- **Payments**: Stripe (abonnements Premium)
- **AI**: OpenAI (modération, catégorisation, chatbot)
- **Video**: Mux (optionnel, fallback pour vidéos)
- **Notifications**: Firebase (PWA push notifications)

## 🚀 Installation Rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd MemeVote

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les variables (voir SETUP_GUIDE.md)

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Configuration Complète

**👉 Voir [SETUP_GUIDE.md](./SETUP_GUIDE.md) pour le guide complet de configuration**

Le guide inclut :
- Configuration Supabase (migrations, storage, realtime)
- Configuration Stripe (clés API, webhooks)
- Configuration OpenAI (clé API)
- Création token $VOTE sur Solana
- Déploiement Edge Function distribute-rewards
- Déploiement sur Vercel

## 📁 Structure du Projet

```
memevote-fun/
├── app/                    # Next.js App Router
│   ├── (main)/            # Routes principales
│   │   ├── feed/          # Feed global
│   │   ├── foryou/        # Feed personnalisé
│   │   ├── upload/        # Upload de memes
│   │   ├── tokens/        # Swap, Buy/Sell, Staking
│   │   ├── rankings/      # Leaderboard, Trending, Battles
│   │   └── ...
│   └── api/               # API routes
│       ├── stripe/        # Stripe webhooks
│       ├── moderate/      # Modération OpenAI
│       └── ...
├── components/            # Composants React
│   ├── ui/               # Composants Shadcn/UI
│   ├── meme/             # Composants memes
│   ├── wallet/           # Composants wallet
│   └── ...
├── lib/                   # Utilitaires
│   ├── supabase/         # Client Supabase
│   ├── solana/           # Configuration Solana
│   └── utils.ts
├── hooks/                 # React hooks personnalisés
├── supabase/              # Supabase config
│   ├── migrations/       # Migrations SQL
│   └── functions/        # Edge Functions
└── public/                # Assets statiques
```

## 📝 Scripts Disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build de production
- `npm run start` - Démarre le serveur de production
- `npm run lint` - Lint le code

## 🔧 Prérequis

- Node.js 18+
- Compte Supabase (gratuit)
- Wallet Solana (Phantom recommandé)
- Clés API : Stripe, OpenAI (optionnel au début)

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

Configurer les variables d'environnement dans le dashboard Vercel.

**👉 Voir [SETUP_GUIDE.md](./SETUP_GUIDE.md) section 7 pour plus de détails**

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une PR.

---

**Pour toute question ou problème, consultez [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

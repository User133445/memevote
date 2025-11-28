# 🔐 Guide des Clés API et Secrets - MemeVote.fun

Ce document explique où et comment ajouter toutes les clés API nécessaires pour faire fonctionner MemeVote.fun.

## ⚠️ IMPORTANT - Sécurité

**NE JAMAIS** :
- Commiter des clés privées dans Git
- Partager des clés en clair dans des messages
- Stocker des clés dans le code source
- Utiliser des clés de production en développement

**TOUJOURS** :
- Utiliser des variables d'environnement (`.env.local`)
- Ajouter `.env.local` au `.gitignore`
- Utiliser des clés de test en développement
- Roter les clés régulièrement

---

## 📋 Liste Complète des Clés Requises

### 1. Supabase (OBLIGATOIRE)

**Où les obtenir** :
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte et un projet
3. Allez dans **Settings** → **API**

**Variables à ajouter dans `.env.local`** :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Utilisation** :
- `NEXT_PUBLIC_SUPABASE_URL` : URL publique de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme (sécurisée pour le frontend)
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (⚠️ SECRÈTE, uniquement pour API routes)

---

### 2. Solana (OBLIGATOIRE)

**Où les obtenir** :
- RPC public : Utilisez les endpoints publics (gratuits mais limités)
- RPC privé : Hébergez votre propre node ou utilisez un service (QuickNode, Alchemy, etc.)

**Variables à ajouter dans `.env.local`** :
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_VOTE_TOKEN_MINT=your_vote_token_mint_address
NEXT_PUBLIC_TREASURY_WALLET=your_treasury_wallet_address
```

**Pour Devnet (développement)** :
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**RPC Providers recommandés** :
- **QuickNode** : [quicknode.com](https://www.quicknode.com/) - Payant mais fiable
- **Alchemy** : [alchemy.com](https://www.alchemy.com/) - Payant, excellent support
- **Helius** : [helius.dev](https://www.helius.dev/) - Payant, optimisé Solana
- **Public RPC** : Gratuit mais rate-limited

---

### 3. Stripe (Premium Subscriptions)

**Où les obtenir** :
1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte
3. Allez dans **Developers** → **API keys**

**Variables à ajouter dans `.env.local`** :
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Configuration Webhook** :
1. Allez dans **Developers** → **Webhooks**
2. Créez un endpoint : `https://votre-domaine.com/api/stripe/webhook`
3. Sélectionnez les événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copiez le **Signing secret** dans `STRIPE_WEBHOOK_SECRET`

**Mode Test vs Production** :
- **Test** : Clés commençant par `pk_test_` et `sk_test_`
- **Production** : Clés commençant par `pk_live_` et `sk_live_`

---

### 4. DeepSeek / OpenAI (AI Features)

**Où les obtenir** :
- **DeepSeek** : [deepseek.com](https://www.deepseek.com/) - Alternative moins chère à OpenAI
- **OpenAI** : [platform.openai.com](https://platform.openai.com/)

**Variables à ajouter dans `.env.local`** :
```env
DEEPSEEK_API_KEY=sk-...
# OU
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_ENABLED=true
```

**Utilisation** :
- Modération automatique des memes
- Catégorisation intelligente
- Prédiction de score viral
- Chatbot assistant

---

### 5. Twitter / X API (Social Sharing)

**Où les obtenir** :
1. Allez sur [developer.twitter.com](https://developer.twitter.com/)
2. Créez une app
3. Obtenez les clés OAuth 2.0

**Variables à ajouter dans `.env.local`** :
```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

**Note** : Si l'utilisateur refuse les permissions de post, le système utilise un fallback avec Twitter Intent (pas de clé requise).

---

### 6. CoinGecko (Token Prices)

**Pas de clé requise** pour l'API gratuite (rate limit : 10-50 calls/minute).

**Si vous avez besoin de plus de requêtes** :
1. Allez sur [coingecko.com/api](https://www.coingecko.com/api)
2. Créez un compte Pro
3. Obtenez votre clé API

**Variables à ajouter dans `.env.local` (optionnel)** :
```env
COINGECKO_API_KEY=your_coingecko_api_key
```

---

### 7. IPFS / Cloudinary (Media Hosting)

**IPFS** :
- Utilisez un service comme Pinata, Web3.Storage, ou NFT.Storage
- **Pinata** : [pinata.cloud](https://www.pinata.cloud/)

**Variables à ajouter dans `.env.local`** :
```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

**Cloudinary** :
- [cloudinary.com](https://cloudinary.com/)

**Variables à ajouter dans `.env.local`** :
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 8. WalletConnect (Multi-Chain)

**Où les obtenir** :
1. Allez sur [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Créez un projet
3. Obtenez votre Project ID

**Variables à ajouter dans `.env.local`** :
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

---

### 9. Firebase (Push Notifications - Optionnel)

**Où les obtenir** :
1. Allez sur [firebase.google.com](https://firebase.google.com/)
2. Créez un projet
3. Allez dans **Project Settings** → **General** → **Your apps**

**Variables à ajouter dans `.env.local`** :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

---

### 10. Mux (Video Processing - Optionnel)

**Où les obtenir** :
1. Allez sur [mux.com](https://www.mux.com/)
2. Créez un compte
3. Allez dans **Settings** → **API Access Tokens**

**Variables à ajouter dans `.env.local`** :
```env
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
```

---

### 11. Wormhole (Cross-Chain Bridge - Optionnel)

**Où les obtenir** :
1. Allez sur [wormhole.com](https://wormhole.com/)
2. Consultez la documentation pour les endpoints RPC

**Variables à ajouter dans `.env.local`** :
```env
WORMHOLE_RPC_URL=your_wormhole_rpc_url
WORMHOLE_API_KEY=your_wormhole_api_key
```

---

### 12. Multi-Chain Configuration

**Base Chain** :
```env
NEXT_PUBLIC_ENABLE_BASE=true
```

**Blast Chain** :
```env
NEXT_PUBLIC_ENABLE_BLAST=true
```

---

### 13. Analytics & Monitoring

**Google Analytics** :
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Sentry (Error Tracking)** :
```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## 🔄 Workflow de Configuration

1. **Copiez `.env.example` vers `.env.local`**
2. **Remplissez les clés OBLIGATOIRES** :
   - Supabase
   - Solana RPC
3. **Remplissez les clés OPTIONNELLES** selon vos besoins
4. **Testez en local** : `npm run dev`
5. **Configurez sur Vercel** : Allez dans **Settings** → **Environment Variables**

---

## 🚨 En Cas de Fuite de Clé

1. **Révoquez immédiatement** la clé compromise
2. **Générez une nouvelle clé**
3. **Mettez à jour** toutes les instances (local, staging, production)
4. **Vérifiez les logs** pour détecter des accès non autorisés
5. **Rotez les clés** régulièrement (tous les 3-6 mois)

---

## 📞 Support

Si vous avez des questions sur la configuration des clés, consultez :
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) pour le guide complet
- Les documentations officielles de chaque service
- Les issues GitHub du projet

---

**Dernière mise à jour** : 2024


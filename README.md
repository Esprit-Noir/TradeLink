# TradeLink — Trading Journal

> Transform your raw trade data into actionable behavioral coaching. Stop trading your emotions, trade your plan.

TradeLink est une application full-stack de **journaling de trading** et de **suivi de défis prop firm**. Elle connecte le trade à l'analyse comportementale : import de vos trades, tracking des défis (FTMO, Topstep, FundedNext…), backtesting de stratégies, et statistiques avancées pour identifier vos biais (revenge trading, overtrading, violation de stop, …).

## ✨ Fonctionnalités

- **Dashboard & Overview** — KPIs temps réel, courbe d'équité, heatmaps par heure, vue mondiale des sessions de trading
- **Prop Firm Challenges** — templates de firmes, tracking daily/max drawdown, phases, alertes progressives (80 %, 90 %), payouts, backtest de défis
- **Journal de trading** — journal quotidien avec mood, plan de session, réflexions
- **Import de trades** — import CSV, deduplication broker, screenshots, catégorisation par setups et émotions
- **Backtest** — workbench de replay avec graphiques interactifs, stratégies, export PDF
- **Statistiques avancées** — analyse comportementale, equity curve, win rate, risk management
- **Watchlist & market data** — devises, actions, crypto via TwelveData / Yahoo Finance
- **Multilingue & thèmes** — français/anglais (next-intl), light/dark mode, PWA
- **Espace Admin** — gestion des utilisateurs, plans, tickets support, logs d'action
- **Monétisation** — plans, abonnements avec paiement crypto

## 🧱 Stack technique

| Domaine | Technologie |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript |
| Base de données | PostgreSQL (Supabase) via [Prisma](https://www.prisma.io) 7 |
| Authentification | [NextAuth](https://next-auth.js.org) v5 (OAuth Google + email/mot de passe) |
| UI | Tailwind CSS v4, framer-motion, lucide-react, sonner |
| Data-viz | recharts, lightweight-charts, react-globe.gl |
| Infra & services | Upstash (rate-limit/redis), Vercel Blob, Resend, TwelveData |
| Internationalisation | next-intl (`src/messages/{en,fr}.json`) |
| Tests | Vitest (`src/**/*.test.ts`) |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- Une base PostgreSQL (Supabase recommandée)
- Clés API pour les services optionnels (voir `.env.example`)

### Installation

```bash
npm install

# Copier et renseigner les variables d'environnement
cp .env.example .env.local

# Appliquer le schéma de base de données
npx prisma migrate deploy

# Optionnel : seed des achievements
npm run db:seed:achievements
```

### Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## 📦 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Génère le client Prisma puis build de production |
| `npm run start` | Lance le build de production |
| `npm run lint` | Lint ESLint |
| `npm test` / `npm run test:run` | Tests Vitest (watch / one-shot) |
| `npm run test:coverage` | Tests avec couverture |
| `npm run db:seed:achievements` | Seed des données d'achievements |

## 🗂️ Structure du projet

```
src/
├── app/
│   ├── (app)/          # Pages authentifiées (dashboard, challenges, trades, …)
│   ├── api/            # Routes API (73 endpoints)
│   └── register/       # Inscription
├── components/         # Composants UI par domaine (dashboard, prop-firm, backtest, …)
├── lib/                # Services & logique métier (metrics, behavioral, backtest, prop-firm…)
├── emails/             # Templates d'emails (react-email)
├── messages/           # Traductions i18n (en, fr)
├── i18n/               # Configuration i18n
├── styles/             # Styles globaux
└── types/              # Types TypeScript
prisma/
└── schema.prisma       # Schéma de base de données
```

Le projet suit une architecture **App Router** avec des routes API en `src/app/api/**` et des routes de page sécurisées dans `src/app/(app)/**`. Les services métier volumineux sont regroupés dans `src/lib/` (metrics, behavioral, prop-firm, backtest, market…).

## 🔐 Sécurité & API

- Authentification par session NextAuth, rate-limiting via Upstash
- Rôles utilisateur (`USER`, `ADMIN`, `SUPER_ADMIN`)
- Les variables d'environnement (`DATABASE_URL`, `AUTH_SECRET`, clés API…) ne sont **jamais committées** (`.env*` gitignoré)

## 🧪 Tests

```bash
npm run test:run      # exécution unique
npm run test:coverage # avec couverture
```

## 📄 Licence

Propriétaire — usage privé.

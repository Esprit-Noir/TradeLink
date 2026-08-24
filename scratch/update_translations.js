const fs = require('fs');

const fr = JSON.parse(fs.readFileSync('src/messages/fr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));

const marketingFr = {
  Nav: {
    features: "Fonctionnalités",
    pricing: "Tarifs",
    reviews: "Avis",
    dashboard: "Aller au Dashboard",
    logout: "Déconnexion",
    login: "Connexion",
    startFree: "Démarrer Gratuitement",
    language: "Langue"
  },
  Hero: {
    badge: "Plateforme d'Analyse IA Avancée",
    title1: "Vos Trades Méritent",
    title2: "Mieux Qu'une Simple Intuition",
    subtitle: "TradeLink analyse chacune de vos entrées, sorties et décisions — puis vous dit exactement quoi corriger. Conçu pour les traders financés qui refusent d'échouer.",
    startFree: "Démarrer Gratuitement",
    howItWorks: "Voir Comment Ça Marche",
    rating: "4.9/5 par plus de 2400 traders financés",
    tradesAnalyzed: "Trades Analysés",
    clientRetention: "Rétention Client",
    fundedTraders: "Traders Financés",
    trustedBy: "Approuvé par les traders réussissant les challenges chez"
  },
  Features: {
    badge: "L'Arsenal",
    title1: "Maîtrisez Votre",
    title2: "Avantage Compétitif",
    subtitle: "Du coaching comportemental par IA à la gestion des risques en temps réel — TradeLink donne aux traders financés les outils pour réussir les challenges et préserver leurs comptes.",
    aiTitle: "Coaching Comportemental IA",
    aiDesc: "Détecte le revenge trading, le tilt, l'overtrading et les spirales émotionnelles avant qu'ils ne détruisent votre compte. Notre IA croise vos habitudes de timing, de positionnement et de P&L.",
    aiF1: "Détection de tilt en temps réel",
    aiF2: "Reconnaissance de modèles sur plus de 50 métriques",
    aiF3: "Plans d'action hebdomadaires personnalisés",
    quantTitle: "Plus de 50 Rapports Quantitatifs",
    quantDesc: "Chaque métrique qu'un quant professionnel suivrait : profit factor, espérance, ratio de Sortino, analyse du drawdown, performance horaire, et bien plus encore.",
    propTitle: "Suivi Prop Firm",
    propDesc: "Suivi en temps réel du drawdown, de la perte journalière et de l'objectif de profit pour FTMO, Topstep, FundedNext et d'autres. Ne violez plus jamais une règle par accident.",
    propF1: "Synchronisation automatique avec vos brokers",
    propF2: "Surveillance de la courbe de capitaux"
  },
  HowItWorks: {
    badge: "Comment Ça Marche",
    title1: "Trois Étapes vers",
    title2: "Des Profits Constants",
    subtitle: "Arrêtez de deviner. Commencez à mesurer. Notre cadre éprouvé vous aide à identifier ce qui fonctionne, à éliminer ce qui ne fonctionne pas, et à bâtir une régularité durable.",
    step1Title: "Importez Vos Trades",
    step1Desc: "Connectez votre broker ou importez des fichiers CSV. Nous supportons MetaTrader, TradingView, Interactive Brokers et plus de 20 autres plateformes. Synchronisation automatique en quelques secondes.",
    step1D1: "Import CSV/Excel",
    step1D2: "Synchro API Broker",
    step1D3: "Support MT4 & MT5",
    step1D4: "Synchro temps réel",
    step2Title: "Obtenez des Insights par IA",
    step2Desc: "Notre IA analyse chaque aspect de votre trading — timing d'entrée, gestion du risque, schémas émotionnels et performance des setups. Obtenez des recommandations personnalisées.",
    step2D1: "Analyse comportementale",
    step2D2: "Détection de modèles",
    step2D3: "Score de risque",
    step2D4: "Classement des setups",
    step3Title: "Améliorez Votre Avantage",
    step3Desc: "Suivez votre plan d'action personnalisé. Suivez vos progrès avec des analyses détaillées. Construisez une discipline et une régularité qui se traduisent par de vrais profits.",
    step3D1: "Plans d'action",
    step3D2: "Suivi des progrès",
    step3D3: "Responsabilité",
    step3D4: "Résultats constants"
  },
  Pricing: {
    badge: "Tarifs",
    title1: "Un Investissement dans Votre",
    title2: "Avantage Compétitif",
    subtitle: "Moins cher qu'un seul stop-loss touché. Paiement en Crypto possible.",
    f1Unlimited: "Comptes illimités",
    f1Limited: "{count} compte(s) de trading",
    f2Limited: "Jusqu'à {count} trades/mois",
    f2Unlimited: "Trades illimités",
    f3: "Analyses P&L de base",
    f4: "Import CSV & saisie manuelle",
    f5: "Stats avancées & Insights",
    f6: "Simulateur Replay de Trade",
    f7: "Suivi Prop Firm",
    period: "/mois",
    descElite: "L'arsenal complet pour les traders sérieux et les challenges prop firm.",
    descPro: "Des outils avancés pour accélérer votre avantage compétitif.",
    descBasic: "Pour les débutants qui trouvent leurs repères et tiennent leur journal de trading.",
    ctaElite: "Passer à Elite",
    ctaPro: "Démarrer l'Essai Pro",
    ctaBasic: "Démarrer"
  },
  Cta: {
    title1: "Prêt à Transformer",
    title2: "Votre Trading ?",
    subtitle: "Rejoignez plus de 10 000 traders qui utilisent TradeLink pour analyser leurs performances, forger leur discipline et améliorer leur avantage. Démarrez gratuitement dès aujourd'hui.",
    f1: "Plan Gratuit à Vie",
    f2: "Sans Carte Bancaire",
    f3: "Configuration en 2 Minutes",
    dashboard: "Aller au Dashboard",
    startFree: "Démarrer Gratuitement — Sans Carte",
    disclaimer: "Rejoignez-nous maintenant. Améliorez votre plan quand vous en avez besoin. Annulez à tout moment."
  }
};

const marketingEn = {
  Nav: {
    features: "Features",
    pricing: "Pricing",
    reviews: "Reviews",
    dashboard: "Go to Dashboard",
    logout: "Log Out",
    login: "Log in",
    startFree: "Start Free",
    language: "Language"
  },
  Hero: {
    badge: "Advanced AI Analytics Platform",
    title1: "Your Trades Deserve",
    title2: "Better Than Gut Feeling",
    subtitle: "TradeLink analyzes every entry, exit, and decision you make — then tells you exactly what to fix. Built for funded traders who refuse to fail.",
    startFree: "Start Free — No Card Needed",
    howItWorks: "See How It Works",
    rating: "4.9/5 from 2,400+ funded traders",
    tradesAnalyzed: "Trades Analyzed",
    clientRetention: "Client Retention",
    fundedTraders: "Funded Traders",
    trustedBy: "Trusted by traders passing challenges at"
  },
  Features: {
    badge: "The Arsenal",
    title1: "Master Your",
    title2: "Trading Edge",
    subtitle: "From AI-powered behavioral coaching to real-time risk management — TradeLink gives funded traders the tools to pass challenges and keep their accounts alive.",
    aiTitle: "AI Behavioral Coaching",
    aiDesc: "Detects revenge trading, tilt, overtrading, and emotional spirals before they blow your account. Our AI cross-references your timing, sizing, and P&L patterns.",
    aiF1: "Real-time tilt detection",
    aiF2: "Pattern recognition across 50+ metrics",
    aiF3: "Personalized weekly action plans",
    quantTitle: "50+ Quant Reports",
    quantDesc: "Every metric a professional quant would track — profit factor, expectancy, Sortino ratio, drawdown analysis, hourly performance, and more.",
    propTitle: "Prop Firm Tracking",
    propDesc: "Real-time drawdown, daily loss, and profit target tracking for FTMO, Topstep, FundedNext, and more. Never accidentally breach a rule again.",
    propF1: "Auto-sync with broker accounts",
    propF2: "Equity curve monitoring"
  },
  HowItWorks: {
    badge: "How It Works",
    title1: "Three Steps to",
    title2: "Consistent Profits",
    subtitle: "Stop guessing. Start measuring. Our proven framework helps you identify what works, eliminate what doesn't, and build lasting consistency.",
    step1Title: "Import Your Trades",
    step1Desc: "Connect your broker or upload CSV files. We support MetaTrader, TradingView, Interactive Brokers, and 20+ other platforms. Auto-sync your trades in seconds.",
    step1D1: "CSV/Excel import",
    step1D2: "Broker API sync",
    step1D3: "MT4 & MT5 support",
    step1D4: "Real-time sync",
    step2Title: "Get AI-Powered Insights",
    step2Desc: "Our AI analyzes every aspect of your trading — entry timing, risk management, emotional patterns, and setup performance. Get personalized recommendations.",
    step2D1: "Behavioral analysis",
    step2D2: "Pattern detection",
    step2D3: "Risk scoring",
    step2D4: "Setup ranking",
    step3Title: "Improve Your Edge",
    step3Desc: "Follow your personalized action plan. Track progress with detailed analytics. Build discipline and consistency that translates to real profits.",
    step3D1: "Action plans",
    step3D2: "Progress tracking",
    step3D3: "Accountability",
    step3D4: "Consistent results"
  },
  Pricing: {
    badge: "Pricing",
    title1: "An Investment in Your",
    title2: "Trading Edge",
    subtitle: "Cheaper than a single stop-loss hit. Pay in Crypto.",
    f1Unlimited: "Unlimited accounts",
    f1Limited: "{count} trading account(s)",
    f2Limited: "Up to {count} trades/mo",
    f2Unlimited: "Unlimited trades",
    f3: "Basic P&L analytics",
    f4: "CSV import & manual entry",
    f5: "Advanced Stats & Insights",
    f6: "Trade Replay Simulator",
    f7: "Prop Firm Tracking",
    period: "/month",
    descElite: "The full arsenal for serious traders and prop firm challenges.",
    descPro: "Advanced tools to accelerate your trading edge.",
    descBasic: "For beginners finding their footing and journaling trades.",
    ctaElite: "Go Elite",
    ctaPro: "Start Pro Trial",
    ctaBasic: "Get Started"
  },
  Cta: {
    title1: "Ready to Transform",
    title2: "Your Trading?",
    subtitle: "Join 10,000+ traders who use TradeLink to analyze performance, build discipline, and improve their edge. Start free today.",
    f1: "Free Forever Plan",
    f2: "No Credit Card",
    f3: "2-Minute Setup",
    dashboard: "Go to Dashboard",
    startFree: "Start Free — No Card Needed",
    disclaimer: "Join now. Upgrade when you need to. Cancel anytime."
  }
};

fr.Marketing = marketingFr;
en.Marketing = marketingEn;

fs.writeFileSync('src/messages/fr.json', JSON.stringify(fr, null, 2));
fs.writeFileSync('src/messages/en.json', JSON.stringify(en, null, 2));

console.log('Translations updated.');

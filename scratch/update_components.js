const fs = require('fs');

// MarketingNav.tsx
let nav = fs.readFileSync('src/components/marketing/MarketingNav.tsx', 'utf8');
if (!nav.includes('useTranslations')) {
  nav = nav.replace('import Link', 'import { useTranslations } from "next-intl"\nimport Link');
  nav = nav.replace('export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {', 'export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {\n  const t = useTranslations("Marketing.Nav")');
  
  // Replace links
  nav = nav.replace(/>Fonctionnalités<\/a>/g, '>{t("features")}</a>');
  nav = nav.replace(/>Tarifs<\/a>/g, '>{t("pricing")}</a>');
  nav = nav.replace(/>Avis<\/a>/g, '>{t("reviews")}</a>');
  
  nav = nav.replace(/Dashboard\s*<LayoutDashboard/g, '{t("dashboard")}\n                  <LayoutDashboard');
  nav = nav.replace(/<LogOut size=\{16\} \/>\s*Déconnexion/g, '<LogOut size={16} />\n                  {t("logout")}');
  
  nav = nav.replace(/>Connexion<\/Link>/g, '>{t("login")}</Link>');
  nav = nav.replace(/\s+Connexion\s+/g, '\n                  {t("login")}\n                '); // specific for desktop nav

  nav = nav.replace(/>Démarrer Gratuitement<\/Link>/g, '>{t("startFree")}</Link>');
  nav = nav.replace(/\s+Démarrer Gratuitement\s+/g, '\n                  {t("startFree")}\n                '); // desktop nav
  
  nav = nav.replace(/Langue/g, '{t("language")}');
  
  fs.writeFileSync('src/components/marketing/MarketingNav.tsx', nav);
}

// MarketingHero.tsx
let hero = fs.readFileSync('src/components/marketing/MarketingHero.tsx', 'utf8');
if (!hero.includes('useTranslations')) {
  hero = hero.replace('import Link', 'import { useTranslations } from "next-intl"\nimport Link');
  hero = hero.replace('export function MarketingHero() {', 'export function MarketingHero() {\n  const t = useTranslations("Marketing.Hero")');
  
  hero = hero.replace(/Plateforme d'Analyse IA Avancée/g, '{t("badge")}');
  hero = hero.replace(/Vos Trades Méritent/g, '{t("title1")}');
  hero = hero.replace(/Mieux Qu'une Simple Intuition/g, '{t("title2")}');
  hero = hero.replace(/TradeLink analyse chacune de vos entrées.*?refusent d'échouer./g, '{t("subtitle")}');
  hero = hero.replace(/Démarrer Gratuitement — Sans Carte/g, '{t("startFree")}');
  hero = hero.replace(/Voir Comment Ça Marche/g, '{t("howItWorks")}');
  hero = hero.replace(/4.9\/5 par plus de 2400 traders financés/g, '{t("rating")}');
  hero = hero.replace(/Trades Analysés/g, '{t("tradesAnalyzed")}');
  hero = hero.replace(/Rétention Client/g, '{t("clientRetention")}');
  hero = hero.replace(/Traders Financés/g, '{t("fundedTraders")}');
  hero = hero.replace(/Approuvé par les traders réussissant les challenges chez/g, '{t("trustedBy")}');
  
  fs.writeFileSync('src/components/marketing/MarketingHero.tsx', hero);
}

// MarketingFeatures.tsx
let feat = fs.readFileSync('src/components/marketing/MarketingFeatures.tsx', 'utf8');
if (!feat.includes('useTranslations')) {
  feat = feat.replace('import { motion', 'import { useTranslations } from "next-intl"\nimport { motion');
  feat = feat.replace('export function MarketingFeatures() {', 'export function MarketingFeatures() {\n  const t = useTranslations("Marketing.Features")');

  feat = feat.replace(/L'Arsenal/g, '{t("badge")}');
  feat = feat.replace(/Maîtrisez Votre/g, '{t("title1")}');
  feat = feat.replace(/Avantage Compétitif/g, '{t("title2")}');
  feat = feat.replace(/Du coaching comportemental par IA.*?préserver leurs comptes./g, '{t("subtitle")}');
  feat = feat.replace(/>Coaching Comportemental IA<\/h3>/g, '>{t("aiTitle")}</h3>');
  feat = feat.replace(/>Détecte le revenge trading.*?positionnement et de P&L.<\/p>/g, '>{t("aiDesc")}</p>');
  feat = feat.replace(/Détection de tilt en temps réel/g, '{t("aiF1")}');
  feat = feat.replace(/Reconnaissance de modèles sur plus de 50 métriques/g, '{t("aiF2")}');
  feat = feat.replace(/Plans d'action hebdomadaires personnalisés/g, '{t("aiF3")}');

  feat = feat.replace(/>Plus de 50 Rapports Quantitatifs<\/h3>/g, '>{t("quantTitle")}</h3>');
  feat = feat.replace(/>Chaque métrique qu'un quant.*?et bien plus encore.<\/p>/g, '>{t("quantDesc")}</p>');

  feat = feat.replace(/>Suivi Prop Firm<\/h3>/g, '>{t("propTitle")}</h3>');
  feat = feat.replace(/>Suivi en temps réel du drawdown.*?règle par accident.<\/p>/g, '>{t("propDesc")}</p>');
  feat = feat.replace(/Synchronisation automatique avec vos brokers/g, '{t("propF1")}');
  feat = feat.replace(/Surveillance de la courbe de capitaux/g, '{t("propF2")}');

  fs.writeFileSync('src/components/marketing/MarketingFeatures.tsx', feat);
}

// MarketingHowItWorks.tsx
let hiw = fs.readFileSync('src/components/marketing/MarketingHowItWorks.tsx', 'utf8');
if (!hiw.includes('useTranslations')) {
  hiw = hiw.replace('import { motion', 'import { useTranslations } from "next-intl"\nimport { motion');
  hiw = hiw.replace('export function MarketingHowItWorks() {', 'export function MarketingHowItWorks() {\n  const t = useTranslations("Marketing.HowItWorks")');

  hiw = hiw.replace(/Comment Ça Marche/g, '{t("badge")}');
  hiw = hiw.replace(/Trois Étapes vers/g, '{t("title1")}');
  hiw = hiw.replace(/Des Profits Constants/g, '{t("title2")}');
  hiw = hiw.replace(/Arrêtez de deviner. Commencez à mesurer.*?bâtir une régularité durable./g, '{t("subtitle")}');

  hiw = hiw.replace(/>Importez Vos Trades<\/h3>/g, '>{t("step1Title")}</h3>');
  hiw = hiw.replace(/>Connectez votre broker.*?en quelques secondes.<\/p>/g, '>{t("step1Desc")}</p>');
  hiw = hiw.replace(/Import CSV\/Excel/g, '{t("step1D1")}');
  hiw = hiw.replace(/Synchro API Broker/g, '{t("step1D2")}');
  hiw = hiw.replace(/Support MT4 & MT5/g, '{t("step1D3")}');
  hiw = hiw.replace(/Synchro temps réel/g, '{t("step1D4")}');

  hiw = hiw.replace(/>Obtenez des Insights par IA<\/h3>/g, '>{t("step2Title")}</h3>');
  hiw = hiw.replace(/>Notre IA analyse chaque aspect.*?recommandations personnalisées.<\/p>/g, '>{t("step2Desc")}</p>');
  hiw = hiw.replace(/Analyse comportementale/g, '{t("step2D1")}');
  hiw = hiw.replace(/Détection de modèles/g, '{t("step2D2")}');
  hiw = hiw.replace(/Score de risque/g, '{t("step2D3")}');
  hiw = hiw.replace(/Classement des setups/g, '{t("step2D4")}');

  hiw = hiw.replace(/>Améliorez Votre Avantage<\/h3>/g, '>{t("step3Title")}</h3>');
  hiw = hiw.replace(/>Suivez votre plan d'action.*?par de vrais profits.<\/p>/g, '>{t("step3Desc")}</p>');
  hiw = hiw.replace(/Plans d'action/g, '{t("step3D1")}');
  hiw = hiw.replace(/Suivi des progrès/g, '{t("step3D2")}');
  hiw = hiw.replace(/Responsabilité/g, '{t("step3D3")}');
  hiw = hiw.replace(/Résultats constants/g, '{t("step3D4")}');

  fs.writeFileSync('src/components/marketing/MarketingHowItWorks.tsx', hiw);
}

// MarketingPricing.tsx
let prc = fs.readFileSync('src/components/marketing/MarketingPricing.tsx', 'utf8');
if (!prc.includes('useTranslations')) {
  prc = prc.replace('import Link', 'import { useTranslations } from "next-intl"\nimport Link');
  prc = prc.replace('export function MarketingPricing({ plans = [] }: { plans?: DbPlan[] }) {', 'export function MarketingPricing({ plans = [] }: { plans?: DbPlan[] }) {\n  const t = useTranslations("Marketing.Pricing")');

  prc = prc.replace(/"Comptes illimités"/g, 't("f1Unlimited")');
  prc = prc.replace(/`${p.maxAccounts} compte\${p.maxAccounts > 1 \? 's' : ''} de trading`/g, 't("f1Limited", { count: p.maxAccounts })');
  
  prc = prc.replace(/`Jusqu'à \${p.maxTradesPerMonth} trades\/mois`/g, 't("f2Limited", { count: p.maxTradesPerMonth })');
  prc = prc.replace(/"Trades illimités"/g, 't("f2Unlimited")');

  prc = prc.replace(/"Analyses P&L de base"/g, 't("f3")');
  prc = prc.replace(/"Import CSV & saisie manuelle"/g, 't("f4")');
  prc = prc.replace(/"Stats avancées & Insights"/g, 't("f5")');
  prc = prc.replace(/"Simulateur Replay de Trade"/g, 't("f6")');
  prc = prc.replace(/"Suivi Prop Firm"/g, 't("f7")');

  prc = prc.replace(/"\/mois"/g, 't("period")');
  prc = prc.replace(/"L'arsenal complet pour les traders sérieux et les challenges prop firm."/g, 't("descElite")');
  prc = prc.replace(/"Des outils avancés pour accélérer votre avantage compétitif."/g, 't("descPro")');
  prc = prc.replace(/"Pour les débutants qui trouvent leurs repères et tiennent leur journal de trading."/g, 't("descBasic")');

  prc = prc.replace(/"Passer à Elite"/g, 't("ctaElite")');
  prc = prc.replace(/"Démarrer l'Essai Pro"/g, 't("ctaPro")');
  prc = prc.replace(/"Démarrer"/g, 't("ctaBasic")');

  prc = prc.replace(/>Tarifs<\/span>/g, '>{t("badge")}</span>');
  prc = prc.replace(/Un Investissement dans Votre/g, '{t("title1")}');
  prc = prc.replace(/Avantage Compétitif/g, '{t("title2")}');
  prc = prc.replace(/Moins cher qu'un seul stop-loss touché. Paiement en Crypto possible./g, '{t("subtitle")}');

  fs.writeFileSync('src/components/marketing/MarketingPricing.tsx', prc);
}

// MarketingCta.tsx
let cta = fs.readFileSync('src/components/marketing/MarketingCta.tsx', 'utf8');
if (!cta.includes('useTranslations')) {
  cta = cta.replace('import Link', 'import { useTranslations } from "next-intl"\nimport Link');
  cta = cta.replace('export function MarketingCta({ isLoggedIn }: { isLoggedIn?: boolean }) {', 'export function MarketingCta({ isLoggedIn }: { isLoggedIn?: boolean }) {\n  const t = useTranslations("Marketing.Cta")');

  cta = cta.replace(/Prêt à Transformer/g, '{t("title1")}');
  cta = cta.replace(/Votre Trading \?/g, '{t("title2")}');
  cta = cta.replace(/Rejoignez plus de 10 000 traders.*?dès aujourd'hui./g, '{t("subtitle")}');
  cta = cta.replace(/Plan Gratuit à Vie/g, '{t("f1")}');
  cta = cta.replace(/Sans Carte Bancaire/g, '{t("f2")}');
  cta = cta.replace(/Configuration en 2 Minutes/g, '{t("f3")}');
  
  cta = cta.replace(/Aller au Dashboard/g, '{t("dashboard")}');
  cta = cta.replace(/Démarrer Gratuitement — Sans Carte/g, '{t("startFree")}');
  cta = cta.replace(/Rejoignez-nous maintenant. Améliorez votre plan quand vous en avez besoin. Annulez à tout moment./g, '{t("disclaimer")}');

  fs.writeFileSync('src/components/marketing/MarketingCta.tsx', cta);
}

console.log('Components updated.');

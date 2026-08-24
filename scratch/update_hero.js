const fs = require('fs');
let hero = fs.readFileSync('src/components/marketing/MarketingHero.tsx', 'utf8');

if (!hero.includes('useTranslations("Marketing.Hero")')) {
  hero = hero.replace('export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {', 'export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {\n  const t = useTranslations("Marketing.Hero");');
  
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

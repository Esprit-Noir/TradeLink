const fs = require('fs');

let hiw = fs.readFileSync('src/components/marketing/MarketingHowItWorks.tsx', 'utf8');

// The steps array definition
const arrayDefMatch = hiw.match(/const STEPS = \[\s*\{[\s\S]*?\}\s*\]\n/);
if (arrayDefMatch) {
  let arrayDef = arrayDefMatch[0];
  // Remove from outside
  hiw = hiw.replace(arrayDef, '');
  
  // Fix the syntax inside the array
  arrayDef = arrayDef.replace(/"\{t\("([^"]+)"\)\}"/g, 't("$1")');
  arrayDef = arrayDef.replace(/title: "Importez Vos Trades"/g, 'title: t("step1Title")');
  arrayDef = arrayDef.replace(/description:\s*"Connectez votre broker.*?en quelques secondes."/g, 'description: t("step1Desc")');
  
  arrayDef = arrayDef.replace(/title: "Obtenez des Insights par IA"/g, 'title: t("step2Title")');
  arrayDef = arrayDef.replace(/description:\s*"Notre IA analyse chaque aspect.*?recommandations personnalisées."/g, 'description: t("step2Desc")');

  arrayDef = arrayDef.replace(/title: "Améliorez Votre Avantage"/g, 'title: t("step3Title")');
  arrayDef = arrayDef.replace(/description:\s*"Suivez votre plan d'action.*?par de vrais profits."/g, 'description: t("step3Desc")');

  // Insert inside the component
  hiw = hiw.replace(/export function MarketingHowItWorks\(\) \{\n  const t = useTranslations\("Marketing\.HowItWorks"\)/, `export function MarketingHowItWorks() {\n  const t = useTranslations("Marketing.HowItWorks")\n\n${arrayDef}`);
  
  fs.writeFileSync('src/components/marketing/MarketingHowItWorks.tsx', hiw);
}


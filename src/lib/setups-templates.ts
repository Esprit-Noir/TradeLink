export interface SetupTemplate {
  name: string;
  description: string;
  category: string;
}

export const SETUP_TEMPLATES: SetupTemplate[] = [
  // Smart Money Concepts
  { name: "BOS", description: "Break of Structure - cassure d'un plus haut/plus bas qui confirme la continuation de tendance", category: "Smart Money" },
  { name: "CHoCH", description: "Change of Character - premier signe de retournement de tendance", category: "Smart Money" },
  { name: "Order Block", description: "Dernière bougie opposée avant un mouvement impulsif, zone d'entrée institutionnelle", category: "Smart Money" },
  { name: "FVG / Imbalance", description: "Déséquilibre prix laissé par un mouvement rapide, souvent rempli avant continuation", category: "Smart Money" },
  { name: "Liquidity Sweep", description: "Chasse de liquidité au-dessus/dessous d'un plus haut/bas avant retournement", category: "Smart Money" },
  
  // Price Action & Patterns
  { name: "Range Breakout", description: "Cassure d'une zone de consolidation avec volume", category: "Price Action" },
  { name: "Triangle Breakout", description: "Triangle ascendant, descendant, ou symétrique", category: "Price Action" },
  { name: "Flag / Pennant", description: "Continuation après pause dans une tendance forte", category: "Price Action" },
  { name: "ORB", description: "Opening Range Breakout - cassure du range formé en début de session", category: "Price Action" },
  { name: "Double Top/Bottom", description: "Double sommet ou double creux", category: "Price Action" },
  { name: "Head & Shoulders", description: "Épaule-tête-épaule (standard ou inversée)", category: "Price Action" },
  { name: "Pin Bar / Engulfing", description: "Bougie de rejet sur zone clé", category: "Price Action" },
  { name: "HH/HL Continuation", description: "Higher High / Higher Low continuation en tendance", category: "Price Action" },
  { name: "S/R Bounce", description: "Support/Résistance Bounce - rebond sur zone horizontale clé", category: "Price Action" },

  // Indicateurs & Retracements
  { name: "Divergence", description: "RSI/MACD - prix fait un nouveau extrême mais l'indicateur non", category: "Indicateurs" },
  { name: "Pullback EMA", description: "Pullback vers Moyenne Mobile (EMA 20/50/200)", category: "Indicateurs" },
  { name: "Fibonacci Retracement", description: "Retracement (38.2% / 50% / 61.8%) dans une tendance établie", category: "Indicateurs" },
  { name: "Mean Reversion", description: "Bollinger Bands - retour vers la moyenne après extension", category: "Indicateurs" }
];

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const setupsToAdd = [
  { name: "BOS", description: "Break of Structure - cassure d'un plus haut/plus bas qui confirme la continuation de tendance" },
  { name: "CHoCH", description: "Change of Character - premier signe de retournement de tendance" },
  { name: "Order Block", description: "Dernière bougie opposée avant un mouvement impulsif, zone d'entrée institutionnelle" },
  { name: "FVG / Imbalance", description: "Déséquilibre prix laissé par un mouvement rapide, souvent rempli avant continuation" },
  { name: "Liquidity Sweep", description: "Chasse de liquidité au-dessus/dessous d'un plus haut/bas avant retournement" },
  { name: "Range Breakout", description: "Cassure d'une zone de consolidation avec volume" },
  { name: "Triangle Breakout", description: "Triangle ascendant, descendant, ou symétrique" },
  { name: "Flag / Pennant", description: "Continuation après pause dans une tendance forte" },
  { name: "ORB", description: "Opening Range Breakout - cassure du range formé en début de session" },
  { name: "Double Top/Bottom", description: "Double sommet ou double creux" },
  { name: "Head & Shoulders", description: "Épaule-tête-épaule (standard ou inversée)" },
  { name: "Pin Bar / Engulfing", description: "Bougie de rejet sur zone clé" },
  { name: "Divergence", description: "RSI/MACD - prix fait un nouveau extrême mais l'indicateur non" },
  { name: "Pullback EMA", description: "Pullback vers Moyenne Mobile (EMA 20/50/200)" },
  { name: "Fibonacci Retracement", description: "Retracement (38.2% / 50% / 61.8%) dans une tendance établie" },
  { name: "HH/HL Continuation", description: "Higher High / Higher Low continuation en tendance" },
  { name: "S/R Bounce", description: "Support/Résistance Bounce - rebond sur zone horizontale clé" },
  { name: "Mean Reversion", description: "Bollinger Bands - retour vers la moyenne après extension" }
]

async function main() {
  const user = await prisma.user.findFirst()
  
  if (!user) {
    console.error("No user found in the database. Cannot add setups.")
    return
  }
  
  console.log(`Adding setups for user: ${user.email}`)

  for (const s of setupsToAdd) {
    try {
      await prisma.tradingSetup.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: s.name,
          }
        },
        update: {
          description: s.description
        },
        create: {
          userId: user.id,
          name: s.name,
          description: s.description,
          isDefault: false
        }
      })
      console.log(`Added/Updated: ${s.name}`)
    } catch (err: any) {
      console.error(`Failed to add ${s.name}: ${err.message}`)
    }
  }

  console.log("Done seeding setups.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

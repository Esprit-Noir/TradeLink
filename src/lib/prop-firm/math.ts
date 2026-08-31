// Fonctions pures de calcul des risques d'un Prop Challenge.
// Séparées de prop-firm.service.ts pour être testables unitairement sans base de données.

export type DrawdownType = "static_balance" | "trailing_balance" | "trailing_equity"

/** Référence de solde sur laquelle est calculé le drawdown max selon le type. */
export function maxDdReference(
  drawdownType: DrawdownType,
  initialBalance: number,
  highestBalance: number,
  highestEquity: number,
): number {
  switch (drawdownType) {
    case "static_balance":
      return initialBalance
    case "trailing_balance":
      return highestBalance
    case "trailing_equity":
      return highestEquity
  }
}

/** Seuil absolu de solde en-deçà duquel le max drawdown est violé. */
export function computeMaxDdThreshold(
  drawdownType: DrawdownType,
  initialBalance: number,
  highestBalance: number,
  highestEquity: number,
  maxDDPct: number,
): number {
  const reference = maxDdReference(drawdownType, initialBalance, highestBalance, highestEquity)
  return reference * (1 - maxDDPct / 100)
}

/** Seuil absolu de solde en-deçà duquel le daily drawdown est violé. */
export function computeDailyDdThreshold(todayStartBalance: number, dailyDDPct: number): number {
  return todayStartBalance * (1 - dailyDDPct / 100)
}

/**
 * Pourcentage du budget de drawdown max déjà consommé.
 * 0 = aucun drawdown, 100 = violation du max drawdown.
 */
export function computeDdUsedPct(
  maxDdReferenceValue: number,
  currentBalance: number,
  maxDDPct: number,
): number {
  const ddBudget = maxDdReferenceValue * (maxDDPct / 100)
  if (ddBudget <= 0) return 0
  return ((maxDdReferenceValue - currentBalance) / ddBudget) * 100
}

/** Budget monétaire (€) de drawdown toléré depuis la référence. */
export function computeDdBudget(maxDdReferenceValue: number, maxDDPct: number): number {
  return maxDdReferenceValue * (maxDDPct / 100)
}

/** Profit (en valeur) requis pour passer la phase. */
export function computeProfitTarget(initialBalance: number, profitTargetPct: number): number {
  return initialBalance * (profitTargetPct / 100)
}

/** Profit réalisé (valeur) depuis le solde initial. */
export function computeCurrentProfit(currentBalance: number, initialBalance: number): number {
  return currentBalance - initialBalance
}

/** Ma jour plus grosse (en valeur) parmi les jours tradés, 0 si aucun jour. */
export function biggestDayPnl(daysPnl: number[]): number {
  let biggest = 0
  for (const pnl of daysPnl) biggest = Math.max(biggest, pnl)
  return biggest
}

/** Vérifie la règle de consistance : la plus grosse journée ne doit pas dépasser un % du profit total. */
export function computeConsistencyViolation(
  biggestDayPnlValue: number,
  currentProfit: number,
  consistencyPct: number,
): boolean {
  if (consistencyPct <= 0 || currentProfit <= 0) return false
  const biggestPct = (biggestDayPnlValue / currentProfit) * 100
  return biggestPct > consistencyPct
}

/** Objectif de gain personnalisé (alertes) exprimé en valeur. */
export function computeProfitGoal(profitTarget: number, profitGoalPct: number): number {
  return profitTarget * (profitGoalPct / 100)
}

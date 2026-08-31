import { describe, it, expect } from "vitest"
import {
  computeMaxDdThreshold,
  computeDailyDdThreshold,
  computeDdUsedPct,
  computeDdBudget,
  computeProfitTarget,
  computeCurrentProfit,
  computeConsistencyViolation,
  biggestDayPnl,
  computeProfitGoal,
  maxDdReference,
} from "./math"

describe("maxDdReference — type de référence de drawdown", () => {
  it("static_balance utilise le solde initial (fixe)", () => {
    expect(maxDdReference("static_balance", 10000, 12000, 12500)).toBe(10000)
  })

  it("trailing_balance utilise le solde le plus haut atteint", () => {
    expect(maxDdReference("trailing_balance", 10000, 12000, 12500)).toBe(12000)
  })

  it("trailing_equity utilise l'equity la plus haute", () => {
    expect(maxDdReference("trailing_equity", 10000, 12000, 12500)).toBe(12500)
  })
})

describe("computeMaxDdThreshold — seuil de drawdown max", () => {
  it("static_balance : seuil fixe basé sur le solde initial", () => {
    // 10% de 10000 → seuil à 9000
    expect(computeMaxDdThreshold("static_balance", 10000, 12000, 12500, 10)).toBe(9000)
  })

  it("trailing_balance : le seuil monte avec le pic de solde", () => {
    // Pic 12000, -10% → seuil 10800
    expect(computeMaxDdThreshold("trailing_balance", 10000, 12000, 12500, 10)).toBe(10800)
  })

  it("trailing_equity : seuil basé sur l'equity la plus haute", () => {
    // Equity pic 12500, -10% → seuil 11250
    expect(computeMaxDdThreshold("trailing_equity", 10000, 12000, 12500, 10)).toBe(11250)
  })

  it("gère un maxDDPct de 0 (aucun drawdown toléré)", () => {
    expect(computeMaxDdThreshold("static_balance", 10000, 10000, 10000, 0)).toBe(10000)
  })
})

describe("computeDailyDdThreshold — seuil de drawdown quotidien", () => {
  it("calcule le seuil quotidien depuis le solde de début de journée", () => {
    expect(computeDailyDdThreshold(10000, 5)).toBe(9500)
  })

  it("tolère un drawdown quotidien de 0 %", () => {
    expect(computeDailyDdThreshold(10000, 0)).toBe(10000)
  })

  it("le seuil dépend du solde de début de journée, pas du solde initial", () => {
    expect(computeDailyDdThreshold(11000, 5)).toBe(10450)
  })
})

describe("computeDdUsedPct — pourcentage de drawdown consommé", () => {
  it("0 % quand le solde est à la référence", () => {
    expect(computeDdUsedPct(10000, 10000, 10)).toBe(0)
  })

  it("50 % quand la moitié du budget est consommé", () => {
    // Budget 1000 (10% de 10000) ; balance 9500 → 500/1000 = 50%
    expect(computeDdUsedPct(10000, 9500, 10)).toBeCloseTo(50)
  })

  it("100 % au moment du breach", () => {
    // Balance 9000 sur budget 1000 → (10000-9000)/1000 = 100%
    expect(computeDdUsedPct(10000, 9000, 10)).toBeCloseTo(100)
  })

  it("> 100 % au-delà du seuil", () => {
    expect(computeDdUsedPct(10000, 8500, 10)).toBeGreaterThan(100)
  })

  it("protège contre une division par zéro quand le budget est nul", () => {
    expect(computeDdUsedPct(10000, 9500, 0)).toBe(0)
  })
})

describe("computeDdBudget — budget monétaire de drawdown", () => {
  it("calcule le budget depuis la référence", () => {
    expect(computeDdBudget(10000, 10)).toBe(1000)
  })
})

describe("computeProfitTarget — objectif de profit", () => {
  it("calcule le profit requis pour la phase", () => {
    expect(computeProfitTarget(10000, 10)).toBe(1000)
  })

  it("gère un objectif de 0 %", () => {
    expect(computeProfitTarget(10000, 0)).toBe(0)
  })
})

describe("computeCurrentProfit — profit réalisé", () => {
  it("positif en gain", () => {
    expect(computeCurrentProfit(10500, 10000)).toBe(500)
  })

  it("négatif en perte", () => {
    expect(computeCurrentProfit(9500, 10000)).toBe(-500)
  })
})

describe("computeProfitGoal — objectif d'alerte personnalisé", () => {
  it("calcule le seuil d'alerte en fraction du profit target", () => {
    expect(computeProfitGoal(1000, 50)).toBe(500)
  })
})

describe("biggestDayPnl — plus grosse journée", () => {
  it("retourne le max des PnL quotidiens", () => {
    expect(biggestDayPnl([100, 300, -50, 200])).toBe(300)
  })

  it("retourne 0 pour un tableau vide", () => {
    expect(biggestDayPnl([])).toBe(0)
  })

  it("prend en compte les pertes comme max quand toutes négatives (0 reste le max sûr)", () => {
    expect(biggestDayPnl([-100, -200])).toBe(0)
  })
})

describe("computeConsistencyViolation — règle de consistance", () => {
  it("violation quand la plus grosse journée dépasse le pourcentage autorisé", () => {
    // Profit total 1000, jour max 600 → 60% > 50% → violation
    expect(computeConsistencyViolation(600, 1000, 50)).toBe(true)
  })

  it("pas de violation quand sous le seuil", () => {
    expect(computeConsistencyViolation(400, 1000, 50)).toBe(false)
  })

  it("pas de violation quand au seuil exact (strictement supérieur requis)", () => {
    expect(computeConsistencyViolation(500, 1000, 50)).toBe(false)
  })

  it("pas de violation quand currentProfit est nul ou négatif", () => {
    expect(computeConsistencyViolation(600, 0, 50)).toBe(false)
    expect(computeConsistencyViolation(600, -100, 50)).toBe(false)
  })

  it("pas de violation quand la règle est désactivée (pct = 0)", () => {
    expect(computeConsistencyViolation(600, 1000, 0)).toBe(false)
  })
})

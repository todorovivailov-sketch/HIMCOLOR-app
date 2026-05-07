import { roundMoney } from "@/lib/money";
import type { RecipeCostInput, RecipeCostResult } from "./types";

export function calculateRecipeCost(input: RecipeCostInput): RecipeCostResult {
  if (input.baseOutputKg <= 0) {
    throw new Error("baseOutputKg must be greater than zero");
  }

  if (input.pailNetKg <= 0) {
    throw new Error("pailNetKg must be greater than zero");
  }

  const materialTotal = input.items
    .filter((item) => item.category !== "PACKAGING")
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const pailPackagingTotal = input.items
    .filter((item) => item.category === "PACKAGING" && item.includeInPail)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const containerPackagingTotal = input.items
    .filter((item) => item.category === "PACKAGING" && item.includeInContainer)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const materialCostPerKgEur = roundMoney(materialTotal / input.baseOutputKg);
  const pailPackagingPerKgEur = roundMoney(pailPackagingTotal / input.baseOutputKg);
  const containerPackagingPerKgEur = roundMoney(containerPackagingTotal / input.baseOutputKg);
  const adminCostPerKgEur = roundMoney(input.adminCostPerKgEur);

  return {
    materialCostPerKgEur,
    pailPackagingPerKgEur,
    containerPackagingPerKgEur,
    adminCostPerKgEur,
    pailTotalPerKgEur: roundMoney(materialCostPerKgEur + pailPackagingPerKgEur + adminCostPerKgEur),
    containerTotalPerKgEur: roundMoney(materialCostPerKgEur + containerPackagingPerKgEur + adminCostPerKgEur),
  };
}

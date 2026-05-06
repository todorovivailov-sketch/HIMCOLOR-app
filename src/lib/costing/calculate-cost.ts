import { roundMoney } from "@/lib/money";
import type { RecipeCostInput, RecipeCostResult } from "./types";

export function calculateRecipeCost(input: RecipeCostInput): RecipeCostResult {
  if (input.baseOutputKg <= 0) {
    throw new Error("baseOutputKg must be greater than zero");
  }

  if (input.pailNetKg <= 0) {
    throw new Error("pailNetKg must be greater than zero");
  }

  const pailOutputKg = input.pailOutputKg ?? input.baseOutputKg;
  const containerOutputKg = input.containerOutputKg ?? input.baseOutputKg;
  const legacyOverheadRate = input.legacyOverheadRate ?? 0;

  if (pailOutputKg <= 0) {
    throw new Error("pailOutputKg must be greater than zero");
  }

  if (containerOutputKg <= 0) {
    throw new Error("containerOutputKg must be greater than zero");
  }

  const pailMaterialTotal = input.items
    .filter((item) => item.category !== "PACKAGING" && item.includeInPail)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const containerMaterialTotal = input.items
    .filter((item) => item.category !== "PACKAGING" && item.includeInContainer)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const pailPackagingTotal = input.items
    .filter((item) => item.category === "PACKAGING" && item.includeInPail)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const containerPackagingTotal = input.items
    .filter((item) => item.category === "PACKAGING" && item.includeInContainer)
    .reduce((sum, item) => sum + item.quantityKg * item.priceEur, 0);

  const materialCostPerKgEur = roundMoney(containerMaterialTotal / containerOutputKg);
  const pailBaseCostPerKgEur = roundMoney((pailMaterialTotal + pailPackagingTotal) / pailOutputKg);
  const containerBaseCostPerKgEur = roundMoney((containerMaterialTotal + containerPackagingTotal) / containerOutputKg);
  const pailPackagingPerKgEur = roundMoney(pailPackagingTotal / pailOutputKg);
  const containerPackagingPerKgEur = roundMoney(containerPackagingTotal / containerOutputKg);
  const adminCostPerKgEur = roundMoney(input.adminCostPerKgEur);
  const pailLegacyOverheadPerKgEur = roundMoney(pailBaseCostPerKgEur * legacyOverheadRate);
  const containerLegacyOverheadPerKgEur = roundMoney(containerBaseCostPerKgEur * legacyOverheadRate);

  return {
    materialCostPerKgEur,
    pailPackagingPerKgEur,
    containerPackagingPerKgEur,
    adminCostPerKgEur,
    pailLegacyOverheadPerKgEur,
    containerLegacyOverheadPerKgEur,
    pailTotalPerKgEur: roundMoney(pailBaseCostPerKgEur + pailLegacyOverheadPerKgEur + adminCostPerKgEur),
    containerTotalPerKgEur: roundMoney(containerBaseCostPerKgEur + containerLegacyOverheadPerKgEur + adminCostPerKgEur),
  };
}

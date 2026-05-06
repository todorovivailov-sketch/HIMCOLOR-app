import { db } from "@/lib/db";
import { calculateRecipeCost } from "./calculate-cost";
import type { CostMaterialCategory } from "./types";

export async function loadProductCosts() {
  const recipes = await db.recipe.findMany({
    where: { status: "ACTIVE" },
    include: {
      product: true,
      items: { include: { material: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { product: { name: "asc" } },
  });

  return recipes.map((recipe) => {
    const cost = calculateRecipeCost({
      baseOutputKg: Number(recipe.baseOutputKg),
      pailOutputKg: Number(recipe.pailOutputKg),
      containerOutputKg: Number(recipe.containerOutputKg),
      adminCostPerKgEur: 0,
      pailNetKg: 26,
      legacyOverheadRate: Number(recipe.legacyOverheadRate),
      items: recipe.items.map((item) => ({
        name: item.material.name,
        category: item.material.category as CostMaterialCategory,
        quantityKg: Number(item.quantityKg),
        priceEur: Number(item.material.currentPriceEur),
        includeInPail: item.includeInPail,
        includeInContainer: item.includeInContainer,
      })),
    });

    return {
      productName: recipe.product.name,
      recipeVersion: recipe.version,
      materialCostPerKgEur: cost.materialCostPerKgEur,
      pailPackagingPerKgEur: cost.pailPackagingPerKgEur,
      pailTotalPerKgEur: cost.pailTotalPerKgEur,
      containerTotalPerKgEur: cost.containerTotalPerKgEur,
    };
  });
}

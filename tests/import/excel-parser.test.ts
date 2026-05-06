import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "@/lib/costing/calculate-cost";
import { parseHimcolorWorkbook } from "@/lib/import/excel-parser";

describe("parseHimcolorWorkbook", () => {
  it("extracts products, recipes, and materials from the current workbook", () => {
    const workbookPath = path.join(process.cwd(), "2026 СЕБЕСТОЙНОСТИ - Копие.xlsx");
    const result = parseHimcolorWorkbook(workbookPath);

    expect(result.products.length).toBeGreaterThanOrEqual(12);
    expect(result.materials.some((material) => material.name === "ТОЛУОЛ")).toBe(true);
    expect(result.materials.some((material) => material.name === "БАКИ")).toBe(true);
    expect(result.recipes.some((recipe) => recipe.productName === "БПМ БЯЛА")).toBe(true);

    const whiteRecipe = result.recipes.find((recipe) => recipe.productName === "БПМ БЯЛА");
    expect(whiteRecipe?.items.some((item) => item.materialName === "СМОЛА" && item.quantityKg === 190)).toBe(true);
  });

  it("reproduces imported Excel pail costs for representative recipes", () => {
    const workbookPath = path.join(process.cwd(), "2026 СЕБЕСТОЙНОСТИ - Копие.xlsx");
    const result = parseHimcolorWorkbook(workbookPath);

    const expectedPailCosts = new Map([
      ["БПМ БЯЛА", 1.503168],
      ["БПМ СИТИ", 1.545635],
      ["ШПРИЦ ПЛАСТИК", 2.535821],
      ["РАЗРЕДИТЕЛ ЗА ПЛАСТИК", 3.62575],
    ]);

    for (const [productName, expectedCost] of expectedPailCosts) {
      const recipe = result.recipes.find((item) => item.productName === productName);
      expect(recipe, productName).toBeDefined();

      const cost = calculateRecipeCost({
        baseOutputKg: recipe!.baseOutputKg,
        pailOutputKg: recipe!.pailOutputKg,
        containerOutputKg: recipe!.containerOutputKg,
        adminCostPerKgEur: 0,
        pailNetKg: 26,
        legacyOverheadRate: recipe!.legacyOverheadRate,
        items: recipe!.items.map((item) => ({
          name: item.materialName,
          category: item.category,
          quantityKg: item.quantityKg,
          priceEur: item.priceEur,
          includeInPail: item.includeInPail,
          includeInContainer: item.includeInContainer,
        })),
      });

      expect(cost.pailTotalPerKgEur).toBeCloseTo(expectedCost, 5);
    }
  });
});

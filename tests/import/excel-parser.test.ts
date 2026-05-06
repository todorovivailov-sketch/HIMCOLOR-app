import path from "node:path";
import { describe, expect, it } from "vitest";
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
});

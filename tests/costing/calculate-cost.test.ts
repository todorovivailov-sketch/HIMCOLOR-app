import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "@/lib/costing/calculate-cost";

describe("calculateRecipeCost", () => {
  // Packaging per kg = (n_баки × price_per_бака) / baseOutputKg
  // e.g. 39 баки × 2.98 EUR / 1000 kg base = 0.11622 €/kg
  it("divides pail packaging cost by baseOutputKg (not by pailNetKg)", () => {
    const result = calculateRecipeCost({
      baseOutputKg: 1000,
      adminCostPerKgEur: 0,
      pailNetKg: 26,
      items: [
        { name: "ТОЛУОЛ", category: "RAW", quantityKg: 160, priceEur: 1.62, includeInPail: true, includeInContainer: true },
        { name: "СМОЛА", category: "RAW", quantityKg: 190, priceEur: 2.2, includeInPail: true, includeInContainer: true },
        { name: "БАКИ", category: "PACKAGING", quantityKg: 39, priceEur: 2.98, includeInPail: true, includeInContainer: false },
        { name: "ЕТИКЕТИ", category: "PACKAGING", quantityKg: 39, priceEur: 0.13, includeInPail: true, includeInContainer: false },
      ],
    });

    // material: (160×1.62 + 190×2.2) / 1000 = 677.2 / 1000
    expect(result.materialCostPerKgEur).toBeCloseTo(0.6772, 4);
    // packaging: (39×2.98 + 39×0.13) / 1000 = 121.29 / 1000
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.12129, 5);
    expect(result.containerPackagingPerKgEur).toBe(0);
    expect(result.pailTotalPerKgEur).toBeCloseTo(0.79849, 5);
    expect(result.containerTotalPerKgEur).toBeCloseTo(0.6772, 4);
  });

  it("adds administrative cost equally to pail and container totals", () => {
    const result = calculateRecipeCost({
      baseOutputKg: 1000,
      adminCostPerKgEur: 0.18,
      pailNetKg: 26,
      items: [
        { name: "СУРОВИНА", category: "RAW", quantityKg: 1000, priceEur: 1, includeInPail: true, includeInContainer: true },
        // 39 баки × 2.6 EUR / 1000 = 0.1014 €/kg
        { name: "БАКА", category: "PACKAGING", quantityKg: 39, priceEur: 2.6, includeInPail: true, includeInContainer: false },
      ],
    });

    expect(result.materialCostPerKgEur).toBe(1);
    // (39 × 2.6) / 1000 = 101.4 / 1000 = 0.1014
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.1014, 4);
    expect(result.pailTotalPerKgEur).toBeCloseTo(1.2814, 4);
    expect(result.containerTotalPerKgEur).toBeCloseTo(1.18, 4);
  });
});

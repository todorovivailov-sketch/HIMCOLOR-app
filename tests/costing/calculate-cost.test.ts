import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "@/lib/costing/calculate-cost";

describe("calculateRecipeCost", () => {
  it("calculates material cost per kg from recipe quantities and current prices", () => {
    const result = calculateRecipeCost({
      baseOutputKg: 1000,
      adminCostPerKgEur: 0,
      pailNetKg: 26,
      items: [
        { name: "ТОЛУОЛ", category: "RAW", quantityKg: 160, priceEur: 1.62, includeInPail: true, includeInContainer: true },
        { name: "СМОЛА", category: "RAW", quantityKg: 190, priceEur: 2.2, includeInPail: true, includeInContainer: true },
        { name: "БАКИ", category: "PACKAGING", quantityKg: 1, priceEur: 2.98, includeInPail: true, includeInContainer: false },
        { name: "ЕТИКЕТИ", category: "PACKAGING", quantityKg: 1, priceEur: 0.13, includeInPail: true, includeInContainer: false },
      ],
    });

    expect(result.materialCostPerKgEur).toBeCloseTo(0.6772, 4);
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.00311, 6);
    expect(result.containerPackagingPerKgEur).toBe(0);
    expect(result.pailTotalPerKgEur).toBeCloseTo(0.68031, 6);
    expect(result.containerTotalPerKgEur).toBeCloseTo(0.6772, 4);
  });

  it("adds legacy percentage overhead and real administrative cost to totals", () => {
    const result = calculateRecipeCost({
      baseOutputKg: 1000,
      pailOutputKg: 1000,
      containerOutputKg: 1000,
      adminCostPerKgEur: 0.18,
      pailNetKg: 26,
      legacyOverheadRate: 0.2,
      items: [
        { name: "СУРОВИНА", category: "RAW", quantityKg: 1000, priceEur: 1, includeInPail: true, includeInContainer: true },
        { name: "БАКА", category: "PACKAGING", quantityKg: 1, priceEur: 2.6, includeInPail: true, includeInContainer: false },
      ],
    });

    expect(result.materialCostPerKgEur).toBe(1);
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.0026, 6);
    expect(result.pailLegacyOverheadPerKgEur).toBeCloseTo(0.20052, 6);
    expect(result.pailTotalPerKgEur).toBeCloseTo(1.38312, 6);
    expect(result.containerTotalPerKgEur).toBeCloseTo(1.38, 6);
  });
});

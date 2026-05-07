export type CostMaterialCategory = "RAW" | "PACKAGING" | "ADDITIVE" | "PIGMENT" | "SOLVENT" | "OTHER";

export type RecipeCostItem = {
  name: string;
  category: CostMaterialCategory;
  quantityKg: number;
  priceEur: number;
  includeInPail: boolean;
  includeInContainer: boolean;
};

export type RecipeCostInput = {
  baseOutputKg: number;
  adminCostPerKgEur: number;
  pailNetKg: number;
  items: RecipeCostItem[];
};

export type RecipeCostResult = {
  materialCostPerKgEur: number;
  pailPackagingPerKgEur: number;
  containerPackagingPerKgEur: number;
  adminCostPerKgEur: number;
  pailTotalPerKgEur: number;
  containerTotalPerKgEur: number;
};

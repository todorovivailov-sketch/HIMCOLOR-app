import * as XLSX from "xlsx";

export type ParsedMaterialCategory = "RAW" | "PACKAGING" | "ADDITIVE" | "PIGMENT" | "SOLVENT" | "OTHER";

export type ParsedMaterial = {
  name: string;
  category: ParsedMaterialCategory;
  priceEur: number;
};

export type ParsedRecipeItem = {
  materialName: string;
  quantityKg: number;
  priceEur: number;
  category: ParsedMaterialCategory;
  includeInPail: boolean;
  includeInContainer: boolean;
  sortOrder: number;
};

export type ParsedRecipe = {
  productName: string;
  version: number;
  baseOutputKg: number;
  pailOutputKg: number;
  containerOutputKg: number;
  legacyOverheadRate: number;
  items: ParsedRecipeItem[];
};

export type ParsedWorkbook = {
  products: { name: string }[];
  materials: ParsedMaterial[];
  recipes: ParsedRecipe[];
};

const PACKAGING_NAMES = new Set(["БАКИ", "ЕТИКЕТИ", "ТУБИ", "ТЕНЕКИЯ"]);

const PRODUCT_NAME_BY_SHEET: Record<string, string> = {
  "БПМ БЯЛА": "БПМ БЯЛА",
  "БПМ СИТИ": "БПМ СИТИ",
  "БПМ СИТИ +": "БПМ СИТИ +",
  "ШПРИЦ ПЛАСТИК": "ШПРИЦ ПЛАСТИК",
  "СТРУКТУРЕН ПЛАСТИК": "СТРУКТУРЕН ПЛАСТИК",
  "РАЗРЕДИТЕЛ АК-1": "РАЗРЕДИТЕЛ АК-1",
  "РАЗРЕДИТЕЛ ЗА ПЛАСТИК": "РАЗРЕДИТЕЛ ЗА ПЛАСТИК",
  "БПМ ЖЪЛТА": "БПМ ЖЪЛТА",
  "БПМ ЧЕРНА": "БПМ ЧЕРНА",
  "БПМ СИНЯ": "БПМ СИНЯ",
  "БПМ ЧЕРВЕНА": "БПМ ЧЕРВЕНА",
  "жълт шприц": "ЖЪЛТ ШПРИЦ",
};

function normalizeName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function getCategory(materialName: string): ParsedMaterialCategory {
  const normalized = materialName.toUpperCase();

  if (PACKAGING_NAMES.has(normalized)) return "PACKAGING";
  if (
    normalized.includes("ПИГМЕНТ") ||
    normalized.includes("ЖОБ") ||
    normalized.includes("ХРОМАТ") ||
    normalized.includes("RED") ||
    normalized.includes("HEUCUFIT")
  ) {
    return "PIGMENT";
  }
  if (
    normalized.includes("АЦЕТОН") ||
    normalized.includes("ТОЛУОЛ") ||
    normalized.includes("ТУЛОЛ") ||
    normalized.includes("МЕТИЛ")
  ) {
    return "SOLVENT";
  }
  if (normalized.includes("АДИТОЛ") || normalized.includes("БЕНТОНЕ")) return "ADDITIVE";

  return "RAW";
}

function findHeader(sheet: XLSX.WorkSheet): { row: number; materialCol: number; kgCol: number; priceCol: number } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    let materialCol = -1;
    let kgCol = -1;
    let priceCol = -1;

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      const value = normalizeName(cell?.v).toUpperCase();

      if (value.includes("ВИД НА М")) materialCol = col;
      if (value === "КГ.") kgCol = col;
      if (value.includes("ЦЕНА ЗА КГ")) priceCol = col;
    }

    if (materialCol >= 0 && kgCol >= 0 && priceCol >= 0) {
      return { row, materialCol, kgCol, priceCol };
    }
  }

  return null;
}

function extractFormulaDenominator(sheet: XLSX.WorkSheet, formula: unknown): number | null {
  if (typeof formula !== "string") return null;

  const numericMatch = formula.match(/\/\s*(\d+(?:\.\d+)?)/);
  if (numericMatch) {
    const value = Number(numericMatch[1]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const cellRefMatch = formula.match(/\/\s*([A-Z]+\d+)/i);
  if (cellRefMatch) {
    const value = Number(sheet[cellRefMatch[1].toUpperCase()]?.v);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  return null;
}

function extractOverheadRate(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const rowText = Array.from({ length: range.e.c - range.s.c + 1 }, (_, offset) => {
      const col = range.s.c + offset;
      return normalizeName(sheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v).toUpperCase();
    }).join(" ");

    if (!rowText.includes("ДРУГИ") && !rowText.includes("АДМИН")) continue;

    const percentFromLabel = rowText.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (percentFromLabel) {
      return Number(percentFromLabel[1].replace(",", ".")) / 100;
    }

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const formula = sheet[XLSX.utils.encode_cell({ r: row, c: col })]?.f;
      if (typeof formula !== "string") continue;

      const percentFormula = formula.match(/\*\s*(\d+(?:\.\d+)?)\s*\/\s*100/);
      if (percentFormula) return Number(percentFormula[1]) / 100;

      const decimalFormula = formula.match(/\*\s*(0\.\d+)/);
      if (decimalFormula) return Number(decimalFormula[1]);
    }
  }

  return 0;
}

function extractOutputKg(sheet: XLSX.WorkSheet): { pailOutputKg: number; containerOutputKg: number } {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const label = normalizeName(sheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v).toUpperCase();
      if (!label.includes("СЕБЕСТОЙНОСТ НА 1КГ")) continue;

      const denominators: number[] = [];
      for (let valueCol = col + 1; valueCol <= range.e.c; valueCol += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: valueCol })];
        const denominator = extractFormulaDenominator(sheet, cell?.f);
        if (denominator) denominators.push(denominator);
      }

      return {
        pailOutputKg: denominators[0] ?? 1000,
        containerOutputKg: denominators[1] ?? denominators[0] ?? 1000,
      };
    }
  }

  return { pailOutputKg: 1000, containerOutputKg: 1000 };
}

export function parseHimcolorWorkbook(workbookPath: string): ParsedWorkbook {
  const workbook = XLSX.readFile(workbookPath, { cellFormula: true, cellDates: true });
  const materialMap = new Map<string, ParsedMaterial>();
  const materialPriceByBaseName = new Map<string, number>();
  const products: { name: string }[] = [];
  const recipes: ParsedRecipe[] = [];

  for (const sheetName of workbook.SheetNames) {
    const productName = PRODUCT_NAME_BY_SHEET[sheetName];
    const sheet = workbook.Sheets[sheetName];
    const header = findHeader(sheet);

    if (!productName || !header) continue;

    products.push({ name: productName });

    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    const items: ParsedRecipeItem[] = [];
    const outputKg = extractOutputKg(sheet);

    for (let row = header.row + 1; row <= range.e.r; row += 1) {
      const baseMaterialName = normalizeName(sheet[XLSX.utils.encode_cell({ r: row, c: header.materialCol })]?.v);
      const quantityKg = Number(sheet[XLSX.utils.encode_cell({ r: row, c: header.kgCol })]?.v);
      const priceEur = Number(sheet[XLSX.utils.encode_cell({ r: row, c: header.priceCol })]?.v);

      if (!baseMaterialName || baseMaterialName.toUpperCase() === "ОБЩО") continue;
      if (!Number.isFinite(quantityKg) || quantityKg <= 0) continue;
      if (!Number.isFinite(priceEur) || priceEur < 0) continue;

      const firstKnownPrice = materialPriceByBaseName.get(baseMaterialName);
      const materialName =
        firstKnownPrice !== undefined && Math.abs(firstKnownPrice - priceEur) > 0.000001
          ? `${baseMaterialName} (${productName})`
          : baseMaterialName;
      if (firstKnownPrice === undefined) {
        materialPriceByBaseName.set(baseMaterialName, priceEur);
      }

      const category = getCategory(materialName);
      const includeInPail = true;
      const includeInContainer = category !== "PACKAGING";

      items.push({
        materialName,
        quantityKg,
        priceEur,
        category,
        includeInPail,
        includeInContainer,
        sortOrder: items.length + 1,
      });

      if (!materialMap.has(materialName)) {
        materialMap.set(materialName, { name: materialName, category, priceEur });
      }
    }

    recipes.push({
      productName,
      version: 1,
      baseOutputKg: 1000,
      pailOutputKg: outputKg.pailOutputKg,
      containerOutputKg: outputKg.containerOutputKg,
      legacyOverheadRate: extractOverheadRate(sheet),
      items,
    });
  }

  return {
    products,
    materials: Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name, "bg")),
    recipes,
  };
}

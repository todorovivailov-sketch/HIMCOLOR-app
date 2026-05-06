# Himcolor Core Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Himcolor web app core: materials, products, recipes, packaging variants, cost calculations, and Excel seed import.

**Architecture:** Start with a local Next.js app backed by Prisma and SQLite for fast local development, while keeping the schema compatible with PostgreSQL later. Implement the business logic in focused service modules so the UI, import scripts, and future OCR flow all use the same cost calculation rules.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, SQLite for local dev, Vitest for unit tests, xlsx for Excel import, Tailwind CSS for a dense Bulgarian management UI.

---

## Scope

This plan implements Milestone 1 only:

- app scaffold;
- database schema for core catalog data;
- cost calculation engine;
- Excel import from `2026 СЕБЕСТОЙНОСТИ - Копие.xlsx`;
- Bulgarian UI for overview, materials, products, recipes, and себестойности.

Out of scope for this milestone:

- OCR extraction;
- full warehouse movements;
- sales invoices;
- administrative cost allocation from real monthly expenses;
- authentication and user roles.

These are deliberately left for later milestones because they depend on the correctness of the core product/material/recipe model.

## Target File Structure

Create and maintain these focused files:

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `postcss.config.mjs`: Tailwind/PostCSS config.
- `tailwind.config.ts`: app theme tokens.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: seed/import entrypoint.
- `src/lib/db.ts`: Prisma client singleton.
- `src/lib/money.ts`: money and decimal helpers.
- `src/lib/costing/types.ts`: costing input/output types.
- `src/lib/costing/calculate-cost.ts`: себестойност calculation rules.
- `src/lib/import/excel-parser.ts`: parse current Excel file into normalized seed data.
- `src/lib/import/seed-core-data.ts`: upsert parsed data into database.
- `src/app/layout.tsx`: app shell.
- `src/app/page.tsx`: dashboard overview.
- `src/app/materials/page.tsx`: materials list.
- `src/app/products/page.tsx`: products list.
- `src/app/recipes/page.tsx`: recipes list.
- `src/app/costs/page.tsx`: себестойности overview.
- `src/components/app-sidebar.tsx`: left navigation.
- `src/components/page-header.tsx`: shared page title/actions.
- `src/components/data-table.tsx`: simple table component.
- `src/components/kpi-card.tsx`: dashboard metric card.
- `tests/costing/calculate-cost.test.ts`: unit tests for costing logic.
- `tests/import/excel-parser.test.ts`: unit tests for Excel parser behavior.

## Data Model Summary

Use English model names internally and Bulgarian labels in the UI.

Core entities:

- `Material`: raw materials and packaging materials.
- `MaterialPrice`: price history.
- `Supplier`: supplier catalog.
- `Product`: sellable product.
- `PackagingVariant`: бака, контейнер, future packaging forms.
- `Recipe`: versioned formula for a product.
- `RecipeItem`: material quantity in a recipe.
- `CostSnapshot`: calculated cost at a point in time for comparison and audit.

Important rules:

- Currency is always EUR.
- Packaging materials live in `Material` with category `PACKAGING`.
- Current cost uses latest active material prices.
- Recipe versions are preserved.
- Standard first packaging variants are `Бака` and `Контейнер`.
- Standard бака net quantity is 26 kg.
- Container cost excludes бака/етикет by default.

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create package manifest**

Create `package.json`:

```json
{
  "name": "himcolor-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "import:excel": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create Next.js config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 3: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create Tailwind and global CSS**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E2422",
        panel: "#F7F5EF",
        line: "#D8D2C4",
        accent: "#0F766E",
        danger: "#B42318",
      },
    },
  },
  plugins: [],
};

export default config;
```

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f7f5ef;
  color: #1e2422;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 5: Create minimal layout and page**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Himcolor App",
  description: "Управление на рецепти, себестойности и производство",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Himcolor App</h1>
      <p className="mt-2 text-sm text-neutral-700">
        Работно табло за материали, рецепти и себестойности.
      </p>
    </main>
  );
}
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Verify app starts**

Run:

```bash
npm run build
```

Expected: Next.js build succeeds.

- [ ] **Step 8: Commit scaffold**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts src/app
git commit -m "chore: scaffold web app"
```

---

### Task 2: Add Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env.example`
- Create: `.env`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Add local environment files**

Create `.env.example`:

```env
DATABASE_URL="file:./dev.db"
```

Create `.env`:

```env
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 2: Write Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum MaterialCategory {
  RAW
  PACKAGING
  ADDITIVE
  PIGMENT
  SOLVENT
  OTHER
}

enum RecipeStatus {
  ACTIVE
  ARCHIVED
}

enum PackagingKind {
  PAIL
  CONTAINER
  OTHER
}

model Supplier {
  id        String     @id @default(cuid())
  name      String     @unique
  vatNumber String?
  contact   String?
  phone     String?
  email     String?
  address   String?
  notes     String?
  materials Material[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Material {
  id                 String           @id @default(cuid())
  name               String           @unique
  category           MaterialCategory
  unit               String           @default("kg")
  currentPriceEur    Decimal          @default(0)
  weightedAvgPriceEur Decimal         @default(0)
  stockQuantity      Decimal          @default(0)
  minStockQuantity   Decimal?
  supplierId         String?
  supplier           Supplier?        @relation(fields: [supplierId], references: [id])
  prices             MaterialPrice[]
  recipeItems        RecipeItem[]
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
}

model MaterialPrice {
  id          String    @id @default(cuid())
  materialId  String
  material    Material  @relation(fields: [materialId], references: [id], onDelete: Cascade)
  priceEur    Decimal
  validFrom   DateTime
  supplierId  String?
  note        String?
  createdAt   DateTime  @default(now())

  @@index([materialId, validFrom])
}

model Product {
  id                 String             @id @default(cuid())
  name               String             @unique
  category           String?
  unit               String             @default("kg")
  active             Boolean            @default(true)
  notes              String?
  recipes            Recipe[]
  packagingVariants  PackagingVariant[]
  costSnapshots      CostSnapshot[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

model PackagingVariant {
  id            String        @id @default(cuid())
  productId     String
  product       Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  name          String
  kind          PackagingKind
  netKg         Decimal?
  includePackaging Boolean    @default(false)
  active        Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([productId, name])
}

model Recipe {
  id            String       @id @default(cuid())
  productId     String
  product       Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  version       Int
  status        RecipeStatus @default(ACTIVE)
  validFrom     DateTime
  baseOutputKg  Decimal      @default(1000)
  note          String?
  items         RecipeItem[]
  snapshots     CostSnapshot[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([productId, version])
  @@index([productId, status])
}

model RecipeItem {
  id           String   @id @default(cuid())
  recipeId     String
  recipe       Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  materialId   String
  material     Material @relation(fields: [materialId], references: [id])
  quantityKg   Decimal
  includeInContainer Boolean @default(true)
  includeInPail      Boolean @default(true)
  sortOrder     Int

  @@index([recipeId])
  @@index([materialId])
}

model CostSnapshot {
  id                  String   @id @default(cuid())
  productId            String
  product              Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  recipeId             String
  recipe               Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  calculatedAt         DateTime @default(now())
  materialCostPerKgEur Decimal
  pailPackagingPerKgEur Decimal
  containerPackagingPerKgEur Decimal
  adminCostPerKgEur    Decimal @default(0)
  pailTotalPerKgEur    Decimal
  containerTotalPerKgEur Decimal
}
```

- [ ] **Step 3: Add Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 4: Generate and migrate database**

Run:

```bash
npm run db:generate
npx prisma migrate dev --name init_core_schema
```

Expected: Prisma client is generated and SQLite dev database is created.

- [ ] **Step 5: Commit schema**

Run:

```bash
git add .env.example prisma/schema.prisma src/lib/db.ts package.json package-lock.json
git commit -m "feat: add core database schema"
```

Do not commit `.env`.

---

### Task 3: Implement Cost Calculation Engine

**Files:**
- Create: `src/lib/money.ts`
- Create: `src/lib/costing/types.ts`
- Create: `src/lib/costing/calculate-cost.ts`
- Create: `tests/costing/calculate-cost.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `tests/costing/calculate-cost.test.ts`:

```ts
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
        { name: "ЕТИКЕТИ", category: "PACKAGING", quantityKg: 1, priceEur: 0.13, includeInPail: true, includeInContainer: false }
      ]
    });

    expect(result.materialCostPerKgEur).toBeCloseTo(0.6772, 4);
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.119615, 6);
    expect(result.containerPackagingPerKgEur).toBe(0);
    expect(result.pailTotalPerKgEur).toBeCloseTo(0.796815, 6);
    expect(result.containerTotalPerKgEur).toBeCloseTo(0.6772, 4);
  });

  it("adds administrative cost equally to pail and container totals", () => {
    const result = calculateRecipeCost({
      baseOutputKg: 1000,
      adminCostPerKgEur: 0.18,
      pailNetKg: 26,
      items: [
        { name: "СУРОВИНА", category: "RAW", quantityKg: 1000, priceEur: 1, includeInPail: true, includeInContainer: true },
        { name: "БАКА", category: "PACKAGING", quantityKg: 1, priceEur: 2.6, includeInPail: true, includeInContainer: false }
      ]
    });

    expect(result.materialCostPerKgEur).toBe(1);
    expect(result.pailPackagingPerKgEur).toBeCloseTo(0.1, 6);
    expect(result.pailTotalPerKgEur).toBeCloseTo(1.28, 6);
    expect(result.containerTotalPerKgEur).toBeCloseTo(1.18, 6);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- tests/costing/calculate-cost.test.ts
```

Expected: FAIL because `@/lib/costing/calculate-cost` does not exist.

- [ ] **Step 3: Add types**

Create `src/lib/costing/types.ts`:

```ts
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
```

- [ ] **Step 4: Add money helper**

Create `src/lib/money.ts`:

```ts
export function roundMoney(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
```

- [ ] **Step 5: Implement calculation**

Create `src/lib/costing/calculate-cost.ts`:

```ts
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
  const pailPackagingPerKgEur = roundMoney(pailPackagingTotal / input.pailNetKg);
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
```

- [ ] **Step 6: Run tests and verify pass**

Run:

```bash
npm run test -- tests/costing/calculate-cost.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit calculation engine**

Run:

```bash
git add src/lib/money.ts src/lib/costing tests/costing
git commit -m "feat: add recipe cost calculation"
```

---

### Task 4: Build Excel Parser

**Files:**
- Create: `src/lib/import/excel-parser.ts`
- Create: `tests/import/excel-parser.test.ts`

- [ ] **Step 1: Write parser test**

Create `tests/import/excel-parser.test.ts`:

```ts
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
```

- [ ] **Step 2: Run parser test and verify failure**

Run:

```bash
npm run test -- tests/import/excel-parser.test.ts
```

Expected: FAIL because parser file does not exist.

- [ ] **Step 3: Implement parser**

Create `src/lib/import/excel-parser.ts`:

```ts
import * as XLSX from "xlsx";

type ParsedMaterial = {
  name: string;
  category: "RAW" | "PACKAGING" | "ADDITIVE" | "PIGMENT" | "SOLVENT" | "OTHER";
  priceEur: number;
};

type ParsedRecipeItem = {
  materialName: string;
  quantityKg: number;
  priceEur: number;
  category: ParsedMaterial["category"];
  includeInPail: boolean;
  includeInContainer: boolean;
  sortOrder: number;
};

type ParsedRecipe = {
  productName: string;
  version: number;
  baseOutputKg: number;
  items: ParsedRecipeItem[];
};

type ParsedWorkbook = {
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
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function getCategory(materialName: string): ParsedMaterial["category"] {
  const normalized = materialName.toUpperCase();

  if (PACKAGING_NAMES.has(normalized)) return "PACKAGING";
  if (normalized.includes("ПИГМЕНТ") || normalized.includes("ЖОБ") || normalized.includes("ХРОМАТ") || normalized.includes("RED")) return "PIGMENT";
  if (normalized.includes("АЦЕТОН") || normalized.includes("ТОЛУОЛ") || normalized.includes("ТУЛОЛ") || normalized.includes("МЕТИЛ")) return "SOLVENT";
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

export function parseHimcolorWorkbook(workbookPath: string): ParsedWorkbook {
  const workbook = XLSX.readFile(workbookPath, { cellFormula: true, cellDates: true });
  const materialMap = new Map<string, ParsedMaterial>();
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

    for (let row = header.row + 1; row <= range.e.r; row += 1) {
      const materialName = normalizeName(sheet[XLSX.utils.encode_cell({ r: row, c: header.materialCol })]?.v);
      const quantityKg = Number(sheet[XLSX.utils.encode_cell({ r: row, c: header.kgCol })]?.v);
      const priceEur = Number(sheet[XLSX.utils.encode_cell({ r: row, c: header.priceCol })]?.v);

      if (!materialName || materialName.toUpperCase() === "ОБЩО") continue;
      if (!Number.isFinite(quantityKg) || quantityKg <= 0) continue;
      if (!Number.isFinite(priceEur) || priceEur < 0) continue;

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
      items,
    });
  }

  return {
    products,
    materials: Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name, "bg")),
    recipes,
  };
}
```

- [ ] **Step 4: Run parser test**

Run:

```bash
npm run test -- tests/import/excel-parser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit parser**

Run:

```bash
git add src/lib/import/excel-parser.ts tests/import/excel-parser.test.ts
git commit -m "feat: parse initial Excel workbook"
```

---

### Task 5: Seed Core Data

**Files:**
- Create: `src/lib/import/seed-core-data.ts`
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement database seed logic**

Create `src/lib/import/seed-core-data.ts`:

```ts
import { db } from "@/lib/db";
import { parseHimcolorWorkbook } from "./excel-parser";

export async function seedCoreDataFromExcel(workbookPath: string) {
  const parsed = parseHimcolorWorkbook(workbookPath);
  const validFrom = new Date("2026-05-05T00:00:00.000Z");

  for (const material of parsed.materials) {
    const savedMaterial = await db.material.upsert({
      where: { name: material.name },
      update: {
        category: material.category,
        currentPriceEur: material.priceEur,
        weightedAvgPriceEur: material.priceEur,
      },
      create: {
        name: material.name,
        category: material.category,
        currentPriceEur: material.priceEur,
        weightedAvgPriceEur: material.priceEur,
      },
    });

    await db.materialPrice.create({
      data: {
        materialId: savedMaterial.id,
        priceEur: material.priceEur,
        validFrom,
        note: "Начална цена от Excel файл 2026 СЕБЕСТОЙНОСТИ",
      },
    });
  }

  for (const product of parsed.products) {
    const savedProduct = await db.product.upsert({
      where: { name: product.name },
      update: {},
      create: { name: product.name },
    });

    await db.packagingVariant.upsert({
      where: { productId_name: { productId: savedProduct.id, name: "Бака" } },
      update: { kind: "PAIL", netKg: 26, includePackaging: true },
      create: {
        productId: savedProduct.id,
        name: "Бака",
        kind: "PAIL",
        netKg: 26,
        includePackaging: true,
      },
    });

    await db.packagingVariant.upsert({
      where: { productId_name: { productId: savedProduct.id, name: "Контейнер" } },
      update: { kind: "CONTAINER", includePackaging: false },
      create: {
        productId: savedProduct.id,
        name: "Контейнер",
        kind: "CONTAINER",
        includePackaging: false,
      },
    });
  }

  for (const recipe of parsed.recipes) {
    const product = await db.product.findUniqueOrThrow({ where: { name: recipe.productName } });

    await db.recipe.updateMany({
      where: { productId: product.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    const savedRecipe = await db.recipe.create({
      data: {
        productId: product.id,
        version: recipe.version,
        status: "ACTIVE",
        validFrom,
        baseOutputKg: recipe.baseOutputKg,
        note: "Начална рецепта от Excel файл",
      },
    });

    for (const item of recipe.items) {
      const material = await db.material.findUniqueOrThrow({ where: { name: item.materialName } });

      await db.recipeItem.create({
        data: {
          recipeId: savedRecipe.id,
          materialId: material.id,
          quantityKg: item.quantityKg,
          includeInPail: item.includeInPail,
          includeInContainer: item.includeInContainer,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  return {
    products: parsed.products.length,
    materials: parsed.materials.length,
    recipes: parsed.recipes.length,
  };
}
```

- [ ] **Step 2: Add seed entrypoint**

Create `prisma/seed.ts`:

```ts
import path from "node:path";
import { seedCoreDataFromExcel } from "@/lib/import/seed-core-data";

async function main() {
  const workbookPath = path.join(process.cwd(), "2026 СЕБЕСТОЙНОСТИ - Копие.xlsx");
  const result = await seedCoreDataFromExcel(workbookPath);
  console.log(`Seeded ${result.products} products, ${result.materials} materials, ${result.recipes} recipes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: Run seed**

Run:

```bash
npm run db:seed
```

Expected: prints a message with at least 12 products, at least 20 materials, and 12 recipes.

- [ ] **Step 4: Inspect seeded data**

Run:

```bash
npx prisma studio
```

Expected: Prisma Studio opens and shows populated `Material`, `Product`, `Recipe`, and `RecipeItem` tables.

- [ ] **Step 5: Commit seed**

Run:

```bash
git add src/lib/import/seed-core-data.ts prisma/seed.ts package.json package-lock.json
git commit -m "feat: seed core data from Excel"
```

---

### Task 6: Build App Shell and Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/page-header.tsx`
- Create: `src/components/kpi-card.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/app-sidebar.tsx`:

```tsx
import Link from "next/link";
import { BarChart3, Boxes, Factory, FileText, FlaskConical, Home, Package, ReceiptText, Settings, ShoppingCart, Truck } from "lucide-react";

const navItems = [
  { href: "/", label: "Табло", icon: Home },
  { href: "/production", label: "Производство", icon: Factory },
  { href: "/products", label: "Продукти и рецепти", icon: Package },
  { href: "/materials", label: "Материали и склад", icon: Boxes },
  { href: "/sales", label: "Продажби и клиенти", icon: ShoppingCart },
  { href: "/purchases", label: "Покупки и доставчици", icon: Truck },
  { href: "/expenses", label: "Разходи", icon: ReceiptText },
  { href: "/documents", label: "Документи", icon: FileText },
  { href: "/samples", label: "Мостри", icon: FlaskConical },
  { href: "/reports", label: "Справки", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-72 border-r border-line bg-[#EEE8DA] px-4 py-5">
      <div className="mb-7">
        <div className="text-lg font-semibold tracking-wide">Himcolor</div>
        <div className="text-xs text-neutral-600">Управление на себестойности</div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create page header**

Create `src/components/page-header.tsx`:

```tsx
type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 3: Create KPI card**

Create `src/components/kpi-card.tsx`:

```tsx
type KpiCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 text-sm text-neutral-600">{detail}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Update root layout**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Himcolor App",
  description: "Управление на рецепти, себестойности и производство",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <AppSidebar />
        <div className="min-h-screen pl-72">
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit shell**

Run:

```bash
git add src/app/layout.tsx src/components
git commit -m "feat: add Bulgarian app shell"
```

---

### Task 7: Build Core Read-Only Pages

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/materials/page.tsx`
- Create: `src/app/products/page.tsx`
- Create: `src/app/recipes/page.tsx`
- Create: `src/app/costs/page.tsx`
- Create: `src/components/data-table.tsx`

- [ ] **Step 1: Create table component**

Create `src/components/data-table.tsx`:

```tsx
type DataTableProps<T> = {
  columns: { key: keyof T; label: string; align?: "left" | "right" }[];
  rows: T[];
};

export function DataTable<T extends Record<string, React.ReactNode>>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#E7DFCF] text-left">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={`px-3 py-2 font-medium ${column.align === "right" ? "text-right" : ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-line">
              {columns.map((column) => (
                <td key={String(column.key)} className={`px-3 py-2 ${column.align === "right" ? "text-right" : ""}`}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Materials page**

Create `src/app/materials/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";

export default async function MaterialsPage() {
  const materials = await db.material.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title="Материали и склад"
        description="Суровини, опаковки, текущи цени и начални наличности."
        action={<button className="rounded-md bg-accent px-3 py-2 text-sm text-white">Нов материал</button>}
      />
      <DataTable
        columns={[
          { key: "name", label: "Материал" },
          { key: "category", label: "Категория" },
          { key: "price", label: "Цена €/кг", align: "right" },
          { key: "stock", label: "Наличност", align: "right" },
        ]}
        rows={materials.map((material) => ({
          name: material.name,
          category: material.category,
          price: Number(material.currentPriceEur).toFixed(4),
          stock: Number(material.stockQuantity).toFixed(2),
        }))}
      />
    </>
  );
}
```

- [ ] **Step 3: Products page**

Create `src/app/products/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";

export default async function ProductsPage() {
  const products = await db.product.findMany({
    include: { recipes: true, packagingVariants: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Продукти и рецепти"
        description="Продукти, активни рецепти и опаковъчни варианти."
        action={<button className="rounded-md bg-accent px-3 py-2 text-sm text-white">Нов продукт</button>}
      />
      <DataTable
        columns={[
          { key: "name", label: "Продукт" },
          { key: "recipes", label: "Рецепти", align: "right" },
          { key: "packaging", label: "Опаковки", align: "right" },
          { key: "status", label: "Статус" },
        ]}
        rows={products.map((product) => ({
          name: product.name,
          recipes: product.recipes.length,
          packaging: product.packagingVariants.length,
          status: product.active ? "Активен" : "Неактивен",
        }))}
      />
    </>
  );
}
```

- [ ] **Step 4: Recipes page**

Create `src/app/recipes/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";

export default async function RecipesPage() {
  const recipes = await db.recipe.findMany({
    include: { product: true, items: true },
    orderBy: [{ product: { name: "asc" } }, { version: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Рецепти"
        description="Активни и архивни версии на производствените формули."
        action={<button className="rounded-md bg-accent px-3 py-2 text-sm text-white">Нова рецепта</button>}
      />
      <DataTable
        columns={[
          { key: "product", label: "Продукт" },
          { key: "version", label: "Версия", align: "right" },
          { key: "items", label: "Материали", align: "right" },
          { key: "base", label: "База кг", align: "right" },
          { key: "status", label: "Статус" },
        ]}
        rows={recipes.map((recipe) => ({
          product: recipe.product.name,
          version: recipe.version,
          items: recipe.items.length,
          base: Number(recipe.baseOutputKg).toFixed(0),
          status: recipe.status === "ACTIVE" ? "Активна" : "Архивна",
        }))}
      />
    </>
  );
}
```

- [ ] **Step 5: Dashboard page**

Modify `src/app/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const [materials, products, recipes] = await Promise.all([
    db.material.count(),
    db.product.count(),
    db.recipe.count(),
  ]);

  return (
    <>
      <PageHeader title="Табло" description="Обзор на основните данни в Himcolor App." />
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Материали" value={String(materials)} detail="Суровини и опаковки" />
        <KpiCard label="Продукти" value={String(products)} detail="Активни и архивни" />
        <KpiCard label="Рецепти" value={String(recipes)} detail="Версии в системата" />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit pages**

Run:

```bash
git add src/app src/components/data-table.tsx
git commit -m "feat: add core read-only pages"
```

---

### Task 8: Add Cost Overview Page

**Files:**
- Create: `src/lib/costing/load-product-costs.ts`
- Create: `src/app/costs/page.tsx`

- [ ] **Step 1: Create product cost loader**

Create `src/lib/costing/load-product-costs.ts`:

```ts
import { db } from "@/lib/db";
import { calculateRecipeCost } from "./calculate-cost";

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
      adminCostPerKgEur: 0,
      pailNetKg: 26,
      items: recipe.items.map((item) => ({
        name: item.material.name,
        category: item.material.category,
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
```

- [ ] **Step 2: Create cost page**

Create `src/app/costs/page.tsx`:

```tsx
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { loadProductCosts } from "@/lib/costing/load-product-costs";

export default async function CostsPage() {
  const costs = await loadProductCosts();

  return (
    <>
      <PageHeader
        title="Себестойности"
        description="Текуща управленска себестойност по актуални цени на материалите."
      />
      <DataTable
        columns={[
          { key: "product", label: "Продукт" },
          { key: "version", label: "Версия", align: "right" },
          { key: "materials", label: "Суровини €/кг", align: "right" },
          { key: "packaging", label: "Опаковка бака €/кг", align: "right" },
          { key: "pail", label: "Бака €/кг", align: "right" },
          { key: "container", label: "Контейнер €/кг", align: "right" },
        ]}
        rows={costs.map((cost) => ({
          product: cost.productName,
          version: cost.recipeVersion,
          materials: cost.materialCostPerKgEur.toFixed(4),
          packaging: cost.pailPackagingPerKgEur.toFixed(4),
          pail: cost.pailTotalPerKgEur.toFixed(4),
          container: cost.containerTotalPerKgEur.toFixed(4),
        }))}
      />
    </>
  );
}
```

- [ ] **Step 3: Add nav link**

Modify `src/components/app-sidebar.tsx` and add a link after `Продукти и рецепти`:

```tsx
{ href: "/costs", label: "Себестойности", icon: BarChart3 },
```

- [ ] **Step 4: Build and test**

Run:

```bash
npm run test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 5: Commit costs page**

Run:

```bash
git add src/lib/costing/load-product-costs.ts src/app/costs/page.tsx src/components/app-sidebar.tsx
git commit -m "feat: show current product costs"
```

---

### Task 9: Verify Locally and Push

**Files:**
- No source files expected unless verification finds issues.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 2: Run dev server**

Run:

```bash
npm run dev
```

Expected: app starts on `http://localhost:3000`.

- [ ] **Step 3: Browser smoke test**

Open:

```text
http://localhost:3000
http://localhost:3000/materials
http://localhost:3000/products
http://localhost:3000/recipes
http://localhost:3000/costs
```

Expected:

- sidebar renders;
- pages are in Bulgarian;
- seeded data appears;
- себестойности page shows baка and container values;
- no visible layout overlap.

- [ ] **Step 4: Commit any verification fixes**

If fixes were needed:

```bash
git add <changed files>
git commit -m "fix: stabilize milestone 1 verification"
```

If no fixes were needed, skip this step.

- [ ] **Step 5: Push to GitHub**

Run:

```bash
git push
```

Expected: local `main` is pushed to `origin/main`.

---

## Self-Review Notes

Spec coverage:

- Materials: covered by schema, import, materials page.
- Products: covered by schema, import, products page.
- Recipes and versions: covered by schema and recipes page.
- Cost calculation: covered by calculation engine and costs page.
- Packaging variants: covered by schema and seed defaults.
- Excel import: covered by parser and seed.
- Bulgarian UI shell: covered by app shell and pages.

Deferred by design:

- OCR and documents.
- Warehouse movement ledger.
- Production batches.
- Administrative cost month allocation.
- Customers, suppliers UI beyond supplier schema.
- Sales and margins.

These deferred items require correct core calculations first and should be planned as Milestone 2 and Milestone 3.

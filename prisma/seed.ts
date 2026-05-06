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

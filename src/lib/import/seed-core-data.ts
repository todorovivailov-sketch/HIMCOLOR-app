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

    await db.materialPrice.deleteMany({
      where: {
        materialId: savedMaterial.id,
        validFrom,
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

    const savedRecipe = await db.recipe.upsert({
      where: { productId_version: { productId: product.id, version: recipe.version } },
      update: {
        status: "ACTIVE",
        validFrom,
        baseOutputKg: recipe.baseOutputKg,
        note: "Начална рецепта от Excel файл",
      },
      create: {
        productId: product.id,
        version: recipe.version,
        status: "ACTIVE",
        validFrom,
        baseOutputKg: recipe.baseOutputKg,
        note: "Начална рецепта от Excel файл",
      },
    });

    await db.recipeItem.deleteMany({ where: { recipeId: savedRecipe.id } });

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

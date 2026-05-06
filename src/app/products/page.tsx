import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

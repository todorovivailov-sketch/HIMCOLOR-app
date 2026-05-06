import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

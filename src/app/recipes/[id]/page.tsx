import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RecipeDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default async function RecipeDetailsPage({ params }: RecipeDetailsPageProps) {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: {
      product: true,
      items: {
        include: { material: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!recipe) notFound();

  const materialItems = recipe.items.filter((item) => item.material.category !== "PACKAGING");
  const materialTotalKg = materialItems.reduce((sum, item) => sum + Number(item.quantityKg), 0);
  const baseOutputKg = Number(recipe.baseOutputKg);

  return (
    <>
      <PageHeader
        title={`Рецепта: ${recipe.product.name}`}
        description={`Версия ${recipe.version} · ${recipe.status === "ACTIVE" ? "Активна" : "Архивна"} · база ${baseOutputKg.toFixed(0)} кг`}
        action={
          <Link className="rounded-md border border-line bg-white px-3 py-2 text-sm" href="/recipes">
            Всички рецепти
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-4 gap-3">
        <div className="rounded-md border border-line bg-white p-3">
          <div className="text-xs uppercase text-neutral-500">Суровини кг</div>
          <div className="mt-1 text-xl font-semibold">{materialTotalKg.toFixed(2)}</div>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <div className="text-xs uppercase text-neutral-500">База рецепта</div>
          <div className="mt-1 text-xl font-semibold">{baseOutputKg.toFixed(0)} кг</div>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <div className="text-xs uppercase text-neutral-500">Бака делител</div>
          <div className="mt-1 text-xl font-semibold">{Number(recipe.pailOutputKg).toFixed(0)} кг</div>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <div className="text-xs uppercase text-neutral-500">Legacy разход</div>
          <div className="mt-1 text-xl font-semibold">{formatPercent(Number(recipe.legacyOverheadRate) * 100)}</div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "order", label: "№", align: "right" },
          { key: "material", label: "Материал" },
          { key: "category", label: "Категория" },
          { key: "quantity", label: "Количество", align: "right" },
          { key: "price", label: "Цена €/ед.", align: "right" },
          { key: "amount", label: "Стойност €", align: "right" },
          { key: "percentMaterials", label: "% от суровини", align: "right" },
          { key: "percentBase", label: "% от база", align: "right" },
        ]}
        rows={recipe.items.map((item) => {
          const quantity = Number(item.quantityKg);
          const price = Number(item.material.currentPriceEur);
          const isPackaging = item.material.category === "PACKAGING";
          return {
            order: item.sortOrder,
            material: item.material.name,
            category: isPackaging ? "Опаковка" : item.material.category,
            quantity: quantity.toFixed(quantity % 1 === 0 ? 0 : 2),
            price: price.toFixed(4),
            amount: (quantity * price).toFixed(2),
            percentMaterials: isPackaging || materialTotalKg === 0 ? "—" : formatPercent((quantity / materialTotalKg) * 100),
            percentBase: isPackaging || baseOutputKg === 0 ? "—" : formatPercent((quantity / baseOutputKg) * 100),
          };
        })}
      />
    </>
  );
}

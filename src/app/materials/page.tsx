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

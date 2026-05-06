import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { loadProductCosts } from "@/lib/costing/load-product-costs";

export const dynamic = "force-dynamic";

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

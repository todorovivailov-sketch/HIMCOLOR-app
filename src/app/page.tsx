import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

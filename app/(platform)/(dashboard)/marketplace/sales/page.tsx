import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function MarketplaceSalesPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Продажи" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится список всех продаж всех компаний на площадке.
        </p>
      </div>
    </>
  );
}

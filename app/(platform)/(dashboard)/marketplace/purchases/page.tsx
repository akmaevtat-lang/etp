import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function MarketplacePurchasesPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Закупки" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится список всех закупок всех компаний на площадке.
        </p>
      </div>
    </>
  );
}

import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function MarketplaceCatalogPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Каталог" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится общий каталог товаров и услуг всех компаний на площадке.
        </p>
      </div>
    </>
  );
}

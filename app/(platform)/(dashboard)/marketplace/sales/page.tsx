import { requireCompany } from "@/lib/auth";
import { listProcedures, getProcedureFilterOptions, parseProcedureSearchParams } from "@/lib/procedures";
import { SiteHeader } from "@/components/site-header";
import { ProcedureBrowser } from "@/components/procedure/procedure-browser";

export default async function MarketplaceSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, membership } = await requireCompany();
  const sp = await searchParams;
  const filters = parseProcedureSearchParams(sp);

  const [{ items, total }, filterOptions] = await Promise.all([
    listProcedures({
      scope: "marketplace",
      type: "SALE",
      companyId: membership.companyId,
      userId: user.id,
      ...filters,
    }),
    getProcedureFilterOptions("marketplace", membership.companyId, "SALE"),
  ]);

  return (
    <>
      <SiteHeader title="Продажи" />
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Все продажи</h1>
        <ProcedureBrowser
          items={items}
          total={total}
          filterOptions={filterOptions}
          showStatusFilter
          hideDraftStatusOption
        />
      </div>
    </>
  );
}

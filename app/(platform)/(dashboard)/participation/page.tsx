import { requireCompany } from "@/lib/auth";
import { listProcedures, getProcedureFilterOptions, parseProcedureSearchParams } from "@/lib/procedures";
import { SiteHeader } from "@/components/site-header";
import { ProcedureBrowser } from "@/components/procedure/procedure-browser";

export default async function ParticipationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, membership } = await requireCompany();
  const sp = await searchParams;
  const filters = parseProcedureSearchParams(sp);

  const [{ items, total }, filterOptions] = await Promise.all([
    listProcedures({ scope: "participation", companyId: membership.companyId, userId: user.id, ...filters }),
    getProcedureFilterOptions("participation", membership.companyId),
  ]);

  return (
    <>
      <SiteHeader title="Участие в процедурах" />
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Участие в процедурах</h1>
        <ProcedureBrowser items={items} total={total} filterOptions={filterOptions} showStatusFilter />
      </div>
    </>
  );
}

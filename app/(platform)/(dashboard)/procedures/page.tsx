import { requireCompany } from "@/lib/auth";
import { listProcedures, getProcedureFilterOptions, parseProcedureSearchParams } from "@/lib/procedures";
import { SiteHeader } from "@/components/site-header";
import { ProcedureBrowser } from "@/components/procedure/procedure-browser";
import { CreateProcedureMenu } from "@/components/procedure/create-procedure-menu";

export default async function ProceduresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, membership } = await requireCompany();
  const sp = await searchParams;
  const filters = parseProcedureSearchParams(sp);

  const [{ items, total }, filterOptions] = await Promise.all([
    listProcedures({ scope: "mine", companyId: membership.companyId, userId: user.id, ...filters }),
    getProcedureFilterOptions("mine", membership.companyId),
  ]);

  return (
    <>
      <SiteHeader title="Мои процедуры" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Мои процедуры</h1>
          <CreateProcedureMenu />
        </div>
        <ProcedureBrowser items={items} total={total} filterOptions={filterOptions} showStatusFilter />
      </div>
    </>
  );
}

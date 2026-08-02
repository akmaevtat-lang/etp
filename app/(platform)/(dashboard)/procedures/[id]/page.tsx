import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;

  return (
    <>
      <SiteHeader title={`Процедура ${id}`} />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появятся вкладки: инфо, спецификация, чат, документы.
        </p>
      </div>
    </>
  );
}

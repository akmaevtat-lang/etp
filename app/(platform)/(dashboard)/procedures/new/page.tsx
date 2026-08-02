import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function NewProcedurePage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Новая процедура" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится форма создания процедуры и спецификации.
        </p>
      </div>
    </>
  );
}

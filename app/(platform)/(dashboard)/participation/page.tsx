import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function ParticipationPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Участие в процедурах" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится список процедур, в которых моя компания участвует как участник.
        </p>
      </div>
    </>
  );
}

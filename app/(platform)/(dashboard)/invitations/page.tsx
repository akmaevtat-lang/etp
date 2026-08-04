import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function InvitationsPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Приглашения" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появятся приглашения к участию в процедурах.
        </p>
      </div>
    </>
  );
}

import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function InboxPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Инбокс" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Скоро здесь появится единый мессенджер: системные, ИИ и переписки с участниками.
        </p>
      </div>
    </>
  );
}

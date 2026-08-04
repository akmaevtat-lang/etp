import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Закупка",
  SALE: "Продажа",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  RETRADE: "Переторжка",
  WINNER_SELECTION: "Выбор победителя",
  COMPLETED: "Завершено",
  DOCUMENTS: "Документооборот",
};

export default async function ProceduresPage() {
  const { membership } = await requireCompany();

  const procedures = await db.procedure.findMany({
    where: { organizerId: membership.companyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader title="Мои процедуры" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Мои процедуры</h1>
          <Button nativeButton={false} render={<Link href="/procedures/new" />}>
            Создать процедуру
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Закупки и продажи моей компании</CardTitle>
          </CardHeader>
          <CardContent>
            {procedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет ни одной процедуры.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {procedures.map((procedure) => (
                  <Link
                    key={procedure.id}
                    href={`/procedures/${procedure.id}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <span className="font-medium">{procedure.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{TYPE_LABELS[procedure.type]}</Badge>
                      <Badge>{STATUS_LABELS[procedure.status]}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

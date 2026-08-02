import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

export default async function PlatformDashboardPage() {
  const { membership } = await requireCompany();

  return (
    <>
      <SiteHeader title="Дашборд" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{membership.company.name}</h1>
            <p className="text-sm text-muted-foreground">ИНН {membership.company.inn}</p>
          </div>
          <Button nativeButton={false} render={<Link href="/procedures/new" />}>
            Создать процедуру
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Процедуры</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Пока нет ни одной процедуры.
          </CardContent>
        </Card>
      </div>
    </>
  );
}

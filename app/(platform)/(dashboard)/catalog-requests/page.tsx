import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CatalogRequestsPage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Заявки из каталога" />
      <div className="flex flex-col gap-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Обращения по моим товарам</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Скоро здесь появится список компаний, которые обращаются за товарами и услугами
              из моего каталога.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Мои обращения по чужим товарам</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Скоро здесь появится список товаров и услуг из общего каталога, по которым я
              оставил заявку.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

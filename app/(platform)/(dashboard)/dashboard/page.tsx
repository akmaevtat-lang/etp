import { requireCompany } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

export default async function DashboardPage() {
  const { membership } = await requireCompany();
  const { company } = membership;

  return (
    <>
      <SiteHeader title="Главная" />
      <div className="flex flex-col gap-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>{company.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="text-muted-foreground">ИНН {company.inn}</p>
            {company.description ? (
              <p>{company.description}</p>
            ) : (
              <p className="text-muted-foreground">Описание компании пока не заполнено.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Каталог товаров и услуг</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Скоро здесь появится каталог товаров и услуг компании.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

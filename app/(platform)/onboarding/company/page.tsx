import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCompany } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingCompanyPage() {
  const user = await requireUser();

  const existing = await db.companyMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Создайте компанию</CardTitle>
          <CardDescription>
            Вы станете администратором компании и получите полный доступ к площадке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCompany} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Название компании</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inn">ИНН</Label>
              <Input id="inn" name="inn" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Описание (необязательно)</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">
              Создать компанию
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

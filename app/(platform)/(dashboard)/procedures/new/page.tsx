import { requireCompany } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { createProcedure } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewProcedurePage() {
  await requireCompany();

  return (
    <>
      <SiteHeader title="Новая процедура" />
      <div className="p-4">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Новая процедура</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProcedure} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Тип процедуры</Label>
                <Select
                  name="type"
                  defaultValue="PURCHASE"
                  items={{ PURCHASE: "Закупка", SALE: "Продажа" }}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PURCHASE">Закупка</SelectItem>
                    <SelectItem value="SALE">Продажа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" placeholder="Например, Поставка запчастей для парка КамАЗ" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Описание (необязательно)</Label>
                <Textarea id="description" name="description" />
              </div>
              <Button type="submit" className="w-full">
                Создать процедуру
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitProposalWithItems } from "@/app/(platform)/(dashboard)/procedures/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const money = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(n);

type SpecItem = { id: string; lotNumber: number; name: string; qty: number; unit: string };
type ExistingItem = { specificationItemId: string; price: number; comment: string | null };

export function ProposalForm({
  procedureId,
  specItems,
  existingItems,
  canSubmit,
}: {
  procedureId: string;
  specItems: SpecItem[];
  existingItems: ExistingItem[] | null;
  canSubmit: boolean;
}) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (existingItems) {
    const byId = new Map(existingItems.map((i) => [i.specificationItemId, i]));
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Ваше предложение (отправлено)</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">№ лота</TableHead>
              <TableHead className="min-w-56">Наименование</TableHead>
              <TableHead className="w-32">Ваша цена</TableHead>
              <TableHead className="min-w-48">Комментарий</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specItems.map((item) => {
              const p = byId.get(item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.lotNumber}</TableCell>
                  <TableCell className="whitespace-normal">{item.name || "—"}</TableCell>
                  <TableCell>{p ? money(p.price) : "—"}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">
                    {p?.comment || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!canSubmit) {
    return <p className="text-sm text-muted-foreground">Приём заявок сейчас недоступен.</p>;
  }

  function handleSubmit() {
    const items = specItems.map((item) => ({
      specificationItemId: item.id,
      price: Number(prices[item.id]) || 0,
      comment: comments[item.id] ?? "",
    }));
    if (items.some((i) => i.price <= 0)) {
      toast.error("Укажите цену по каждой позиции");
      return;
    }
    startTransition(async () => {
      try {
        await submitProposalWithItems(procedureId, items);
        toast.success("Заявка отправлена");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось отправить заявку");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Ваше предложение</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">№ лота</TableHead>
            <TableHead className="min-w-56">Наименование</TableHead>
            <TableHead className="w-20">Кол-во</TableHead>
            <TableHead className="w-24">Ед. изм.</TableHead>
            <TableHead className="w-36">Ваша цена за ед.</TableHead>
            <TableHead className="min-w-48">Комментарий</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.lotNumber}</TableCell>
              <TableCell className="whitespace-normal">{item.name || "—"}</TableCell>
              <TableCell>{item.qty}</TableCell>
              <TableCell>{item.unit || "—"}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={prices[item.id] ?? ""}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Textarea
                  className="min-h-8"
                  value={comments[item.id] ?? ""}
                  onChange={(e) => setComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="self-start" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Отправка..." : "Отправить заявку"}
      </Button>
    </div>
  );
}

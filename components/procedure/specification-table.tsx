"use client";

import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addSpecificationItem,
  deleteSpecificationItem,
  updateSpecificationItem,
  type SpecificationItemDTO,
} from "@/app/(platform)/(dashboard)/procedures/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VAT_RATES = [0, 5, 7, 10, 20];

const money = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(n);

function withTotals(item: SpecificationItemDTO): SpecificationItemDTO {
  const priceWithVat = item.priceNoVat * (1 + item.vatRate / 100);
  return {
    ...item,
    priceWithVat,
    totalNoVat: item.qty * item.priceNoVat,
    totalWithVat: item.qty * priceWithVat,
  };
}

export function SpecificationTable({
  procedureId,
  initialItems,
  editable,
}: {
  procedureId: string;
  initialItems: SpecificationItemDTO[];
  editable: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function updateLocal(id: string, patch: Partial<SpecificationItemDTO>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? withTotals({ ...item, ...patch }) : item)),
    );
  }

  function persist(item: SpecificationItemDTO) {
    startTransition(async () => {
      try {
        await updateSpecificationItem(item.id, {
          lotNumber: item.lotNumber,
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          vatRate: item.vatRate,
          priceNoVat: item.priceNoVat,
          characteristics: item.characteristics,
          deliveryTerms: item.deliveryTerms,
        });
      } catch {
        toast.error("Не удалось сохранить изменения");
      }
    });
  }

  function handleAdd() {
    startTransition(async () => {
      try {
        const item = await addSpecificationItem(procedureId);
        setItems((prev) => [...prev, item]);
      } catch {
        toast.error("Не удалось добавить позицию");
      }
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    startTransition(async () => {
      try {
        await deleteSpecificationItem(id);
      } catch {
        toast.error("Не удалось удалить позицию");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">№ лота</TableHead>
            <TableHead className="min-w-56">Наименование</TableHead>
            <TableHead className="w-20">Кол-во</TableHead>
            <TableHead className="w-24">Ед. изм.</TableHead>
            <TableHead className="w-24">НДС</TableHead>
            <TableHead className="w-32">Цена без НДС</TableHead>
            <TableHead className="w-32">Цена с НДС</TableHead>
            <TableHead className="w-32">Сумма без НДС</TableHead>
            <TableHead className="w-32">Сумма с НДС</TableHead>
            <TableHead className="min-w-48">Характеристики</TableHead>
            <TableHead className="min-w-48">Условия поставки</TableHead>
            {editable && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={editable ? 12 : 11} className="text-center text-muted-foreground">
                Пока нет ни одной позиции.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) =>
            editable ? (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={item.lotNumber}
                    onChange={(e) => updateLocal(item.id, { lotNumber: Number(e.target.value) || 1 })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    className="min-h-8"
                    value={item.name}
                    onChange={(e) => updateLocal(item.id, { name: e.target.value })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={item.qty}
                    onChange={(e) => updateLocal(item.id, { qty: Number(e.target.value) || 0 })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateLocal(item.id, { unit: e.target.value })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={String(item.vatRate)}
                    items={Object.fromEntries(VAT_RATES.map((rate) => [String(rate), `${rate}%`]))}
                    onValueChange={(value) => {
                      updateLocal(item.id, { vatRate: Number(value) });
                      persist(withTotals({ ...item, vatRate: Number(value) }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map((rate) => (
                        <SelectItem key={rate} value={String(rate)}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.priceNoVat}
                    onChange={(e) => updateLocal(item.id, { priceNoVat: Number(e.target.value) || 0 })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{money(item.priceWithVat)}</TableCell>
                <TableCell className="text-muted-foreground">{money(item.totalNoVat)}</TableCell>
                <TableCell className="font-medium">{money(item.totalWithVat)}</TableCell>
                <TableCell>
                  <Textarea
                    className="min-h-8"
                    value={item.characteristics}
                    onChange={(e) => updateLocal(item.id, { characteristics: e.target.value })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    className="min-h-8"
                    value={item.deliveryTerms}
                    onChange={(e) => updateLocal(item.id, { deliveryTerms: e.target.value })}
                    onBlur={() => persist(items.find((i) => i.id === item.id)!)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={item.id}>
                <TableCell>{item.lotNumber}</TableCell>
                <TableCell className="whitespace-normal">{item.name || "—"}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{item.unit || "—"}</TableCell>
                <TableCell>{item.vatRate}%</TableCell>
                <TableCell>{money(item.priceNoVat)}</TableCell>
                <TableCell>{money(item.priceWithVat)}</TableCell>
                <TableCell>{money(item.totalNoVat)}</TableCell>
                <TableCell className="font-medium">{money(item.totalWithVat)}</TableCell>
                <TableCell className="whitespace-normal">{item.characteristics || "—"}</TableCell>
                <TableCell className="whitespace-normal">{item.deliveryTerms || "—"}</TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
      {editable && (
        <Button type="button" variant="outline" className="self-start gap-2" onClick={handleAdd}>
          <PlusIcon className="size-4" />
          Добавить позицию
        </Button>
      )}
    </div>
  );
}

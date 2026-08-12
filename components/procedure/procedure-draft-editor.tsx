"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  updateProcedureDraft,
  transitionProcedureStatus,
} from "@/app/(platform)/(dashboard)/procedures/actions";

function toInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function ProcedureDraftEditor({
  procedureId,
  initial,
  meta,
}: {
  procedureId: string;
  initial: {
    title: string;
    description: string;
    deliveryRegion: string;
    deadlineAt: string | null;
    winnerSelectionAt: string | null;
  };
  meta: { companyName: string; createdByName: string; typeLabel: string; number: number };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [deliveryRegion, setDeliveryRegion] = useState(initial.deliveryRegion);
  const [deadlineAt, setDeadlineAt] = useState(toInputValue(initial.deadlineAt));
  const [winnerSelectionAt, setWinnerSelectionAt] = useState(toInputValue(initial.winnerSelectionAt));
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  function save() {
    return updateProcedureDraft(procedureId, { title, description, deliveryRegion, deadlineAt, winnerSelectionAt });
  }

  function handleSaveDraft() {
    startSaving(async () => {
      try {
        await save();
        toast.success("Черновик сохранён");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
      }
    });
  }

  function handlePublish() {
    startPublishing(async () => {
      try {
        await save();
        await transitionProcedureStatus(procedureId, "publish");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось опубликовать");
      }
    });
  }

  const isPending = isSaving || isPublishing;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handlePublish} disabled={isPending}>
          {isPublishing ? "Публикация..." : "Опубликовать"}
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} disabled={isPending}>
          {isSaving ? "Сохранение..." : "Сохранить как черновик"}
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="draft-title">Наименование</Label>
          <Input id="draft-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="draft-description">Описание</Label>
          <Textarea
            id="draft-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введите описание"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="draft-region">Место поставки</Label>
          <Input
            id="draft-region"
            value={deliveryRegion}
            onChange={(e) => setDeliveryRegion(e.target.value)}
            placeholder="Если не указано — берётся из спецификации"
          />
        </div>
      </div>

      <div className="divide-y rounded-lg border">
        <MetaRow label="Компания" value={meta.companyName} />
        <MetaRow label="Сотрудник" value={meta.createdByName} />
        <MetaRow label="Тип" value={meta.typeLabel} />
        <MetaRow label="Статус" value="Черновик" />
        <MetaRow label="Номер заявки" value={meta.number} />
        <MetaRow label="Дата публикации" value="—" />
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <Label htmlFor="draft-deadline" className="text-muted-foreground">
            Приём заявок до
          </Label>
          <Input
            id="draft-deadline"
            type="datetime-local"
            className="w-auto"
            value={deadlineAt}
            onChange={(e) => setDeadlineAt(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <Label htmlFor="draft-winner-at" className="text-muted-foreground">
            Дата выбора победителя
          </Label>
          <Input
            id="draft-winner-at"
            type="datetime-local"
            className="w-auto"
            value={winnerSelectionAt}
            onChange={(e) => setWinnerSelectionAt(e.target.value)}
          />
        </div>
        <MetaRow label="Валюта запроса" value="Российский рубль" />
      </div>
    </div>
  );
}

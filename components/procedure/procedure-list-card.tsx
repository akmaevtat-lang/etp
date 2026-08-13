"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StarIcon, BadgeCheckIcon, Building2Icon } from "lucide-react";
import { toggleFavorite } from "@/app/(platform)/(dashboard)/procedures/actions";
import type { ProcedureListItem } from "@/lib/procedures";

const TYPE_LABELS: Record<string, string> = { PURCHASE: "Закупка", SALE: "Продажа" };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  RETRADE: "Переторжка",
  WINNER_SELECTION: "Выбор победителя",
  COMPLETED: "Завершено",
  DOCUMENTS: "Документооборот",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  RETRADE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  WINNER_SELECTION: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  COMPLETED: "bg-muted text-muted-foreground",
  DOCUMENTS: "bg-muted text-muted-foreground",
};

function formatDeadline(iso: string) {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysLabel =
    days < 0 ? "истёк" : days === 0 ? "сегодня" : `осталось ${days} ${pluralizeDays(days)}`;
  return `до ${datePart} · ${timePart} (${daysLabel})`;
}

function pluralizeDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}

export function ProcedureListCard({ item }: { item: ProcedureListItem }) {
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [, startTransition] = useTransition();

  function handleToggleFavorite() {
    setIsFavorite((prev) => !prev);
    startTransition(async () => {
      try {
        await toggleFavorite(item.id);
      } catch {
        setIsFavorite((prev) => !prev);
      }
    });
  }

  return (
    <div className="flex gap-3 rounded-lg border p-4 transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={handleToggleFavorite}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-amber-500"
        aria-pressed={isFavorite}
      >
        <StarIcon className={isFavorite ? "size-4 fill-amber-400 text-amber-400" : "size-4"} />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <Link href={`/procedures/${item.id}`} className="font-medium hover:underline">
          {item.title}
        </Link>

        <div className="!mt-1.5 flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
            <Building2Icon className="size-3" />
          </span>
          <span className="truncate">{item.organizerName}</span>
          {item.organizerVerified && <BadgeCheckIcon className="size-4 shrink-0 text-emerald-600" />}
        </div>

        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>

        {item.deadlineAt && (
          <p className="text-sm text-muted-foreground">Приём предложений {formatDeadline(item.deadlineAt)}</p>
        )}

        <p className="text-sm text-muted-foreground">
          {TYPE_LABELS[item.type]} №{item.number}
          {item.deliveryRegion && ` · ${item.deliveryRegion}`}
          {item.tags.length > 0 && ` · ${item.tags.join(", ")}`}
        </p>
      </div>
    </div>
  );
}

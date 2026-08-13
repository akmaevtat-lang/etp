import type { ProcedureStatus } from "@prisma/client";

export const STATUS_LABELS: Record<ProcedureStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  RETRADE: "Переторжка",
  WINNER_SELECTION: "Выбор победителя",
  COMPLETED: "Завершено",
  DOCUMENTS: "Документооборот",
};

// Раздел 4 ТЗ_ЗАКУПКИ: цвет бейджа по семантике статуса — тот же набор,
// что и на карточке в списке (procedure-list-card.tsx), чтобы бейдж
// на самой странице процедуры выглядел так же.
const STATUS_CLASSES: Record<ProcedureStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  RETRADE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  WINNER_SELECTION: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  COMPLETED: "bg-muted text-muted-foreground",
  DOCUMENTS: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ProcedureStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

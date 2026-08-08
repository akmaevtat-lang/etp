"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { transitionProcedureStatus, type StatusTransitionAction } from "@/app/(platform)/(dashboard)/procedures/actions";
import type { ProcedureStatus } from "@prisma/client";

const STATUS_LABELS: Record<ProcedureStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  RETRADE: "Переторжка",
  WINNER_SELECTION: "Выбор победителя",
  COMPLETED: "Завершено",
  DOCUMENTS: "Документооборот",
};

// Реальные переходы + одна заглушка ("Новый раунд переторжки" — точка входа,
// настоящий запуск нового раунда будет на вкладке «Спецификация», раздел 6 ТЗ).
const ACTIONS_BY_STATUS: Record<ProcedureStatus, { action?: StatusTransitionAction; label: string; stub?: boolean }[]> = {
  DRAFT: [{ action: "publish", label: "Опубликовать" }],
  PUBLISHED: [
    { action: "startRetrade", label: "Начать переторжку" },
    { action: "goToWinnerSelection", label: "Перейти к выбору победителя" },
  ],
  RETRADE: [
    { label: "Новый раунд переторжки", stub: true },
    { action: "goToWinnerSelection", label: "Перейти к выбору победителя" },
  ],
  WINNER_SELECTION: [{ action: "complete", label: "Завершить" }],
  COMPLETED: [{ action: "openDocuments", label: "Открыть документооборот" }],
  DOCUMENTS: [],
};

export function StatusControl({ procedureId, status }: { procedureId: string; status: ProcedureStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: StatusTransitionAction) {
    startTransition(async () => {
      try {
        await transitionProcedureStatus(procedureId, action);
      } catch {
        toast.error("Не удалось изменить статус");
      }
    });
  }

  const actions = ACTIONS_BY_STATUS[status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Статус: {STATUS_LABELS[status]}</span>
      {actions.map((item) =>
        item.stub ? (
          <Tooltip key={item.label}>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-disabled="true"
                  className="cursor-not-allowed opacity-50"
                  onClick={(e) => e.preventDefault()}
                />
              }
            >
              {item.label}
            </TooltipTrigger>
            <TooltipContent>Скоро — на вкладке «Спецификация»</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => item.action && handleAction(item.action)}
          >
            {item.label}
          </Button>
        ),
      )}
    </div>
  );
}

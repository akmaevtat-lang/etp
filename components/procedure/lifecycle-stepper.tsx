import { CheckIcon } from "lucide-react";
import type { ProcedureStatus } from "@prisma/client";

const STEPS: { status: ProcedureStatus; label: string }[] = [
  { status: "DRAFT", label: "Черновик" },
  { status: "PUBLISHED", label: "Опубликовано" },
  { status: "RETRADE", label: "Переторжка" },
  { status: "WINNER_SELECTION", label: "Выбор победителя" },
  { status: "COMPLETED", label: "Завершено" },
  { status: "DOCUMENTS", label: "Документооборот" },
];

export function LifecycleStepper({ status }: { status: ProcedureStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <CheckIcon className="size-3.5" /> : index + 1}
              </div>
              <span
                className={`text-center text-xs whitespace-nowrap ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${isDone ? "bg-emerald-300" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

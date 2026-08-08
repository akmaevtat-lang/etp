"use client";

import { useRef, useState, useTransition } from "react";
import { CheckSquareIcon, FileTextIcon, ListChecksIcon, MoreHorizontalIcon, UsersIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  createChecklist,
  addChecklistItem,
  toggleChecklistItem,
} from "@/app/(platform)/(dashboard)/procedures/actions";

type ChecklistItemDTO = { id: string; content: string; isDone: boolean };
type ChecklistDTO = { id: string; title: string; items: ChecklistItemDTO[] } | null;

function StubButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="cursor-not-allowed gap-1.5 opacity-50"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
          />
        }
      >
        <Icon className="size-4" />
        {label}
      </TooltipTrigger>
      <TooltipContent>Скоро</TooltipContent>
    </Tooltip>
  );
}

export function ProcedureExtraBlocks({
  procedureId,
  checklist,
}: {
  procedureId: string;
  checklist: ChecklistDTO;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("Чек лист закупки");
  const [newItemContent, setNewItemContent] = useState("");
  const [, startTransition] = useTransition();
  const sectionRef = useRef<HTMLDivElement>(null);

  function handleTriggerClick() {
    if (checklist) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsCreating((prev) => !prev);
  }

  function handleCreate() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        await createChecklist(procedureId, newTitle.trim());
        setIsCreating(false);
      } catch {
        toast.error("Не удалось создать чек-лист");
      }
    });
  }

  function handleAddItem() {
    if (!checklist || !newItemContent.trim()) return;
    const content = newItemContent.trim();
    setNewItemContent("");
    startTransition(async () => {
      try {
        await addChecklistItem(checklist.id, content);
      } catch {
        setNewItemContent(content);
        toast.error("Не удалось добавить пункт");
      }
    });
  }

  function handleToggle(itemId: string) {
    startTransition(async () => {
      try {
        await toggleChecklistItem(itemId);
      } catch {
        toast.error("Не удалось изменить пункт");
      }
    });
  }

  const doneCount = checklist?.items.filter((i) => i.isDone).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  return (
    <div className="space-y-3">
      {(checklist || isCreating) && (
        <div ref={sectionRef} className="space-y-3 rounded-lg border p-4">
          {checklist ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{checklist.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{totalCount} выполнено
                </span>
              </div>
              {totalCount > 0 && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(doneCount / totalCount) * 100}%` }}
                  />
                </div>
              )}
              <div className="space-y-2">
                {checklist.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.isDone} onCheckedChange={() => handleToggle(item.id)} />
                    <span className={item.isDone ? "text-muted-foreground line-through" : ""}>{item.content}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Добавить пункт..."
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                />
                <Button size="sm" variant="outline" onClick={handleAddItem} disabled={!newItemContent.trim()}>
                  Добавить
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Название чек-листа"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim()}>
                Создать
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                Отмена
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={checklist ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={handleTriggerClick}
        >
          <CheckSquareIcon className="size-4" />
          Чек-лист
        </Button>
        <StubButton icon={ListChecksIcon} label="Опросный лист" />
        <StubButton icon={UsersIcon} label="Приглашение компаний" />
        <StubButton icon={FileTextIcon} label="Файлы" />
        <StubButton icon={RefreshCwIcon} label="Переторжка" />
        <StubButton icon={MoreHorizontalIcon} label="Ещё" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProcedureListCard } from "@/components/procedure/procedure-list-card";
import type { ProcedureListItem } from "@/lib/procedures";
import type { ProcedureStatus } from "@prisma/client";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "publishedAt", label: "Дата публикации" },
  { value: "deadlineAt", label: "Приём предложений" },
];

const STATUS_OPTIONS: { value: ProcedureStatus; label: string }[] = [
  { value: "DRAFT", label: "Черновик" },
  { value: "PUBLISHED", label: "Опубликовано" },
  { value: "RETRADE", label: "Переторжка" },
  { value: "WINNER_SELECTION", label: "Выбор победителя" },
  { value: "COMPLETED", label: "Завершено" },
  { value: "DOCUMENTS", label: "Документооборот" },
];

function FilterRow({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  return (
    <Collapsible className="border-b py-1 last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm">
        <span className={active ? "font-medium" : ""}>{label}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ProcedureBrowser({
  items,
  total,
  filterOptions,
  showStatusFilter,
  hideDraftStatusOption,
}: {
  items: ProcedureListItem[];
  total: number;
  filterOptions: { organizers: string[]; regions: string[]; tags: string[] };
  showStatusFilter: boolean;
  hideDraftStatusOption?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function setParam(key: string, value: string | null) {
    updateParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function toggleListParam(key: string, value: string) {
    updateParams((params) => {
      const current = params.getAll(key);
      params.delete(key);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      next.forEach((v) => params.append(key, v));
    });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setParam("q", value || null), 400);
  }

  const sort = searchParams.get("sort") ?? "publishedAt";
  const favoritesOnly = searchParams.get("fav") === "1";
  const organizer = searchParams.get("organizer") ?? "";
  const region = searchParams.get("region") ?? "";
  const selectedTags = searchParams.getAll("tag");
  const selectedStatuses = searchParams.getAll("status");
  const publishedFrom = searchParams.get("pubFrom") ?? "";
  const publishedTo = searchParams.get("pubTo") ?? "";
  const deadlineFrom = searchParams.get("dlFrom") ?? "";
  const deadlineTo = searchParams.get("dlTo") ?? "";

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="flex gap-6">
      <aside className="w-72 shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm font-medium">✨ Рекомендации AI</span>
          <Switch disabled />
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium">★ Только избранное</span>
          <Switch checked={favoritesOnly} onCheckedChange={(v) => setParam("fav", v ? "1" : null)} />
        </div>

        <div>
          <p className="px-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Фильтры</p>
          <div className="rounded-lg border px-3">
            <FilterRow label="Организатор" active={!!organizer}>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={organizer}
                onChange={(e) => setParam("organizer", e.target.value || null)}
              >
                <option value="">Все</option>
                {filterOptions.organizers.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </FilterRow>

            <FilterRow label="Место поставки" active={!!region}>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={region}
                onChange={(e) => setParam("region", e.target.value || null)}
              >
                <option value="">Все</option>
                {filterOptions.regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FilterRow>

            <FilterRow label="Теги" active={selectedTags.length > 0}>
              <div className="flex flex-col gap-2">
                {filterOptions.tags.length === 0 && (
                  <p className="text-xs text-muted-foreground">Нет тегов</p>
                )}
                {filterOptions.tags.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleListParam("tag", tag)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </FilterRow>

            {showStatusFilter && (
              <FilterRow label="Статус запроса" active={selectedStatuses.length > 0}>
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.filter((opt) => !hideDraftStatusOption || opt.value !== "DRAFT").map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedStatuses.includes(opt.value)}
                        onCheckedChange={() => toggleListParam("status", opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </FilterRow>
            )}

            <FilterRow label="Дата публикации" active={!!publishedFrom || !!publishedTo}>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={publishedFrom}
                  onChange={(e) => setParam("pubFrom", e.target.value || null)}
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={publishedTo}
                  onChange={(e) => setParam("pubTo", e.target.value || null)}
                />
              </div>
            </FilterRow>

            <FilterRow label="Окончание приёма предложений" active={!!deadlineFrom || !!deadlineTo}>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={deadlineFrom}
                  onChange={(e) => setParam("dlFrom", e.target.value || null)}
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={deadlineTo}
                  onChange={(e) => setParam("dlTo", e.target.value || null)}
                />
              </div>
            </FilterRow>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
          Очистить
        </Button>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Найти..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <span className="text-sm text-muted-foreground">Записи: {total}</span>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Сортировать:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setParam("sort", opt.value === "publishedAt" ? null : opt.value)}
                className={sort === opt.value ? "font-medium underline underline-offset-4" : "text-muted-foreground"}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ничего не найдено.
            </p>
          ) : (
            items.map((item) => <ProcedureListCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}

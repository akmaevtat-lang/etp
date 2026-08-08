"use client";

import { useState } from "react";
import { BotIcon, BellIcon, Building2Icon, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ThreadListItem } from "@/app/(platform)/(dashboard)/messenger/actions";

const TYPE_ICON = { AI: BotIcon, SYSTEM: BellIcon, PARTICIPANT: Building2Icon } as const;

export function ThreadList({
  threads,
  onSelect,
  hasLoaded,
}: {
  threads: ThreadListItem[];
  onSelect: (id: string) => void;
  hasLoaded: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = threads.filter((t) =>
    `${t.title} ${t.subtitle ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <Input placeholder="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {!hasLoaded ? (
          <div className="flex justify-center py-6">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {threads.length === 0 ? "Пока нет ни одного чата." : "Ничего не найдено."}
          </p>
        ) : (
          filtered.map((thread) => {
            const Icon = TYPE_ICON[thread.type];
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelect(thread.id)}
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-muted"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{thread.title}</span>
                  {thread.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{thread.subtitle}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {thread.lastMessage ?? "Нет сообщений"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

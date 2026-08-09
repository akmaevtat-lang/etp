"use client";

import { useState } from "react";
import { BotIcon, BellIcon, FolderIcon, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ThreadRef } from "@/components/messenger/messenger-provider";
import type { InboxRow } from "@/app/(platform)/(dashboard)/messenger/actions";

function pluralizeChats(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "чат";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "чата";
  return "чатов";
}

export function InboxList({
  rows,
  hasLoaded,
  onSelectThread,
  onSelectGroup,
}: {
  rows: InboxRow[];
  hasLoaded: boolean;
  onSelectThread: (thread: ThreadRef) => void;
  onSelectGroup: (group: { id: string; title: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) => {
    const haystack = row.kind === "thread" ? row.title : `${row.title} ${row.organizerName}`;
    return haystack.toLowerCase().includes(query.toLowerCase());
  });

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
            {rows.length === 0 ? "Пока нет ни одного чата." : "Ничего не найдено."}
          </p>
        ) : (
          filtered.map((row) => {
            if (row.kind === "thread") {
              const Icon = row.type === "AI" ? BotIcon : BellIcon;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    onSelectThread({ id: row.id, type: row.type, title: row.title, subtitle: null })
                  }
                  className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-muted"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{row.title}</span>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.lastMessage ?? "Нет сообщений"}
                    </p>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={row.procedureId}
                type="button"
                onClick={() => {
                  if (row.isOrganizer) {
                    onSelectGroup({ id: row.procedureId, title: row.title });
                  } else if (row.singleThreadId) {
                    onSelectThread({
                      id: row.singleThreadId,
                      type: "PARTICIPANT",
                      title: row.organizerName,
                      subtitle: row.title,
                    });
                  }
                }}
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-muted"
              >
                <FolderIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <p className="truncate text-xs text-muted-foreground">{row.organizerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.chatCount} {pluralizeChats(row.chatCount)}
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

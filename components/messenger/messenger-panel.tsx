"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessenger } from "@/components/messenger/messenger-provider";
import { InboxList } from "@/components/messenger/inbox-list";
import { ThreadList } from "@/components/messenger/thread-list";
import { ThreadView } from "@/components/messenger/thread-view";
import {
  listInboxRows,
  listThreads,
  type InboxRow,
  type ThreadListItem,
} from "@/app/(platform)/(dashboard)/messenger/actions";

const POLL_MS = 5000;

export function MessengerPanel() {
  const { isOpen, close, activeThread, openThread, closeThread, procedureFilter, setProcedureFilter } =
    useMessenger();

  const [inboxRows, setInboxRows] = useState<InboxRow[]>([]);
  const [groupThreads, setGroupThreads] = useState<ThreadListItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [, startTransition] = useTransition();

  // Three levels, derived from state rather than tracked separately —
  // "Мои процедуры" §архитектура: 1 Сообщения → 2 Группа чатов процедуры
  // (организатор only) → 3 Чат. A participant's group click skips straight
  // to level 3 (see InboxList), so level "group" never applies to them.
  const level: "inbox" | "group" | "thread" = activeThread ? "thread" : procedureFilter ? "group" : "inbox";

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        if (procedureFilter) {
          setGroupThreads(await listThreads(procedureFilter.id));
        } else {
          setInboxRows(await listInboxRows());
        }
      } catch {
        // transient network/access errors — next poll will retry
      } finally {
        setHasLoaded(true);
      }
    });
  }, [procedureFilter]);

  useEffect(() => {
    // The open thread polls its own messages (ThreadView) — no need for the
    // list underneath it to keep refreshing in the background too.
    if (!isOpen || level === "thread") return;
    setHasLoaded(false);
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isOpen, level, refresh]);

  if (!isOpen) return null;

  function handleBack() {
    if (activeThread) closeThread();
    else if (procedureFilter) setProcedureFilter(null);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть сообщения"
        onClick={close}
        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
      />
      <div className="fixed inset-y-0 right-0 z-50 flex h-svh w-full max-w-sm flex-col border-l bg-white lg:static lg:z-auto lg:w-96 lg:max-w-none lg:shrink-0">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {level !== "inbox" && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeftIcon />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            {level === "thread" ? (
              <>
                <span className="block truncate text-sm font-medium">{activeThread!.title}</span>
                {activeThread!.subtitle && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {activeThread!.subtitle}
                  </span>
                )}
              </>
            ) : level === "group" ? (
              <span className="block truncate text-sm font-medium">{procedureFilter!.title}</span>
            ) : (
              <span className="text-sm font-medium">Сообщения</span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={close}>
            <XIcon />
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          {level === "thread" ? (
            <ThreadView thread={activeThread!} />
          ) : level === "group" ? (
            <ThreadList
              threads={groupThreads}
              onSelect={(t) => openThread({ id: t.id, type: t.type, title: t.title, subtitle: t.subtitle })}
              hasLoaded={hasLoaded}
            />
          ) : (
            <InboxList
              rows={inboxRows}
              hasLoaded={hasLoaded}
              onSelectThread={openThread}
              onSelectGroup={setProcedureFilter}
            />
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessenger } from "@/components/messenger/messenger-provider";
import { ThreadList } from "@/components/messenger/thread-list";
import { ThreadView } from "@/components/messenger/thread-view";
import { listThreads, type ThreadListItem } from "@/app/(platform)/(dashboard)/messenger/actions";

const POLL_MS = 5000;

export function MessengerPanel() {
  const { isOpen, close, activeThreadId, openThread, closeThread, procedureFilter, setProcedureFilter } =
    useMessenger();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        setThreads(await listThreads(procedureFilter ?? undefined));
      } catch {
        // transient network/access errors — next poll will retry
      } finally {
        setHasLoaded(true);
      }
    });
  }, [procedureFilter]);

  useEffect(() => {
    if (!isOpen) return;
    setHasLoaded(false);
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть сообщения"
        onClick={close}
        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
      />
      <div className="fixed inset-y-0 right-0 z-50 flex h-svh w-full max-w-sm flex-col border-l bg-background lg:static lg:z-auto lg:w-96 lg:max-w-none lg:shrink-0">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {activeThread ? (
            <>
              <Button variant="ghost" size="icon" onClick={closeThread}>
                <ArrowLeftIcon />
              </Button>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{activeThread.title}</span>
                {activeThread.subtitle && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {activeThread.subtitle}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm font-medium">Сообщения</span>
          )}
          <Button variant="ghost" size="icon" className="ml-auto" onClick={close}>
            <XIcon />
          </Button>
        </div>
        {procedureFilter && !activeThread && (
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
            <span>Чаты этой процедуры</span>
            <button type="button" className="underline" onClick={() => setProcedureFilter(null)}>
              Показать все
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          {activeThread ? (
            <ThreadView thread={activeThread} />
          ) : (
            <ThreadList threads={threads} onSelect={openThread} hasLoaded={hasLoaded} />
          )}
        </div>
      </div>
    </>
  );
}

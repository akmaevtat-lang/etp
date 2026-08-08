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
  const { isOpen, close, activeThreadId, openThread, closeThread } = useMessenger();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        setThreads(await listThreads());
      } catch {
        // transient network/access errors — next poll will retry
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  return (
    <div className="flex h-svh w-96 shrink-0 flex-col border-l bg-background">
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
      <div className="min-h-0 flex-1">
        {activeThread ? (
          <ThreadView thread={activeThread} />
        ) : (
          <ThreadList threads={threads} onSelect={openThread} />
        )}
      </div>
    </div>
  );
}

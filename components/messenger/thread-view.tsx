"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { PaperclipIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessenger } from "@/components/messenger/messenger-provider";
import {
  getThreadMessages,
  sendMessage,
  type MessageDTO,
  type ThreadListItem,
} from "@/app/(platform)/(dashboard)/messenger/actions";

const POLL_MS = 4000;

export function ThreadView({ thread }: { thread: ThreadListItem }) {
  const { currentUserId } = useMessenger();
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [draft, setDraft] = useState("");
  // Separate transitions: background polling must not disable the send
  // button while a poll request happens to be in flight.
  const [, startPollTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    startPollTransition(async () => {
      try {
        setMessages(await getThreadMessages(thread.id));
      } catch {
        // transient network/access errors — next poll will retry
      }
    });
  }, [thread.id]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    startSendTransition(async () => {
      try {
        await sendMessage(thread.id, content);
        refresh();
      } catch {
        setDraft(content);
      }
    });
  }

  const readOnly = thread.type === "SYSTEM";
  const assistantLabel = thread.type === "AI" ? "ИИ-помощник" : "Система";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Пока нет сообщений.</p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {!mine && message.senderId === null && (
                  <p className="mb-0.5 text-xs font-medium opacity-70">{assistantLabel}</p>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!readOnly && (
        <div className="flex items-end gap-2 border-t p-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-disabled="true"
                  className="cursor-not-allowed opacity-50"
                  onClick={(e) => e.preventDefault()}
                />
              }
            >
              <PaperclipIcon />
              <span className="sr-only">Вложения</span>
            </TooltipTrigger>
            <TooltipContent>Скоро</TooltipContent>
          </Tooltip>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Написать сообщение..."
            className="min-h-9 flex-1 resize-none"
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim() || isSending}>
            <SendIcon />
          </Button>
        </div>
      )}
    </div>
  );
}

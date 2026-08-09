"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThreadType } from "@prisma/client";

// Minimal info needed to render the level-3 chat header + hand off to
// ThreadView — deliberately smaller than the server's ThreadListItem since
// callers construct this inline (from an inbox row or a group-list row)
// without an extra round-trip.
export type ThreadRef = {
  id: string;
  type: ThreadType;
  title: string;
  subtitle: string | null;
};

// Level-2 "group" scope: which procedure's chats are shown, plus its title
// for the header (passed explicitly by whoever navigates in, so the panel
// never has to re-fetch just to know what to label the back button target).
export type ProcedureFilter = { id: string; title: string } | null;

type MessengerContextValue = {
  currentUserId: string;
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  activeThread: ThreadRef | null;
  openThread: (thread: ThreadRef) => void;
  closeThread: () => void;
  procedureFilter: ProcedureFilter;
  setProcedureFilter: (filter: ProcedureFilter) => void;
};

const MessengerContext = createContext<MessengerContextValue | null>(null);

const STORAGE_KEY = "messenger_open";

export function MessengerProvider({
  currentUserId,
  children,
}: {
  currentUserId: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<ThreadRef | null>(null);
  const [procedureFilter, setProcedureFilterState] = useState<ProcedureFilter>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setIsOpen(true);
  }, []);

  const persist = useCallback((value: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  const close = useCallback(() => {
    setIsOpen(false);
    persist(false);
  }, [persist]);

  const openThread = useCallback((thread: ThreadRef) => setActiveThread(thread), []);
  const closeThread = useCallback(() => setActiveThread(null), []);

  const setProcedureFilter = useCallback((filter: ProcedureFilter) => {
    setProcedureFilterState(filter);
    setActiveThread(null);
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        currentUserId,
        isOpen,
        toggle,
        close,
        activeThread,
        openThread,
        closeThread,
        procedureFilter,
        setProcedureFilter,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  const ctx = useContext(MessengerContext);
  if (!ctx) throw new Error("useMessenger must be used within MessengerProvider");
  return ctx;
}

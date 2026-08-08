"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type MessengerContextValue = {
  currentUserId: string;
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  activeThreadId: string | null;
  openThread: (id: string) => void;
  closeThread: () => void;
  procedureFilter: string | null;
  setProcedureFilter: (procedureId: string | null) => void;
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
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [procedureFilter, setProcedureFilterState] = useState<string | null>(null);

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

  const openThread = useCallback((id: string) => setActiveThreadId(id), []);
  const closeThread = useCallback(() => setActiveThreadId(null), []);

  const setProcedureFilter = useCallback((procedureId: string | null) => {
    setProcedureFilterState(procedureId);
    setActiveThreadId(null);
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        currentUserId,
        isOpen,
        toggle,
        close,
        activeThreadId,
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

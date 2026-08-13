"use server";

import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCompanyAssistantReply } from "@/lib/ai/company-assistant";
import type { ThreadType } from "@prisma/client";

export type ThreadListItem = {
  id: string;
  type: ThreadType;
  procedureId: string | null;
  companyId: string | null;
  title: string;
  subtitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type MessageDTO = {
  id: string;
  content: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
};

// Every thread this company can see: its own AI/SYSTEM threads, PARTICIPANT
// threads where it's the participant (companyId), and PARTICIPANT threads
// on procedures it organizes. Pass procedureId to scope the list down to a
// single procedure's threads (SYSTEM log + PARTICIPANT chats) — used when
// the messenger panel is open on a procedure page (docs/TZ_ZAKUPKI.md §6).
export async function listThreads(procedureId?: string): Promise<ThreadListItem[]> {
  const { membership } = await requireCompany();
  const companyId = membership.companyId;

  const threads = await db.thread.findMany({
    where: {
      AND: [
        { OR: [{ companyId }, { procedure: { organizerId: companyId } }] },
        ...(procedureId ? [{ procedureId }] : []),
      ],
    },
    include: {
      procedure: { select: { title: true, organizerId: true, organizer: { select: { name: true } } } },
      company: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const items = threads.map((thread) => {
    let title: string;
    let subtitle: string | null = null;

    if (thread.type === "AI") {
      title = "ИИ-помощник";
    } else if (thread.type === "SYSTEM") {
      // Company-level SYSTEM thread (procedureId null) vs a procedure's own
      // log thread — same ThreadType, different meaning depending on scope.
      title = thread.procedureId ? "Уведомления закупки" : "Уведомления";
      if (thread.procedureId) subtitle = thread.procedure?.title ?? null;
    } else {
      const isOrganizer = thread.procedure?.organizerId === companyId;
      title = isOrganizer ? (thread.company?.name ?? "Участник") : (thread.procedure?.organizer.name ?? "Организатор");
      subtitle = thread.procedure?.title ?? null;
    }

    const lastMessage = thread.messages[0] ?? null;

    return {
      id: thread.id,
      type: thread.type,
      procedureId: thread.procedureId,
      companyId: thread.companyId,
      title,
      subtitle,
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
    };
  });

  const typeOrder: Record<ThreadType, number> = { AI: 0, SYSTEM: 1, PARTICIPANT: 2 };
  items.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return items;
}

// Level-1 "Сообщения": company-level AI/SYSTEM threads stay flat rows,
// every other thread is grouped by its procedure into a "folder" row —
// see AI_HANDOFF.md for the 3-level (organizer) / 2-level (participant)
// navigation this feeds.
export type InboxRow =
  | {
      kind: "thread";
      id: string;
      type: "AI" | "SYSTEM";
      title: string;
      lastMessage: string | null;
      lastMessageAt: string | null;
    }
  | {
      kind: "procedureGroup";
      procedureId: string;
      title: string;
      organizerName: string;
      chatCount: number;
      isOrganizer: boolean;
      // Only set for participants — lets the UI skip straight to their one
      // chat with the organizer instead of showing an intermediate group.
      singleThreadId: string | null;
      lastMessageAt: string | null;
    };

export async function listInboxRows(): Promise<InboxRow[]> {
  const { membership } = await requireCompany();
  const companyId = membership.companyId;

  const threads = await db.thread.findMany({
    where: { OR: [{ companyId }, { procedure: { organizerId: companyId } }] },
    include: {
      procedure: { select: { title: true, organizerId: true, organizer: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const flatRows: InboxRow[] = [];
  type Group = {
    procedureId: string;
    title: string;
    organizerName: string;
    isOrganizer: boolean;
    participantThreadIds: Set<string>;
    // Participant threads + the procedure's own SYSTEM log thread — what the
    // user actually sees listed once they open the folder, so the folder's
    // chat count should include it too.
    chatThreadIds: Set<string>;
    singleThreadId: string | null;
    lastMessageAt: string | null;
  };
  const groups = new Map<string, Group>();

  for (const thread of threads) {
    const lastMessageAt = thread.messages[0]?.createdAt.toISOString() ?? null;

    if (!thread.procedureId || !thread.procedure) {
      flatRows.push({
        kind: "thread",
        id: thread.id,
        type: thread.type as "AI" | "SYSTEM",
        title: thread.type === "AI" ? "ИИ-помощник" : "Уведомления",
        lastMessage: thread.messages[0]?.content ?? null,
        lastMessageAt,
      });
      continue;
    }

    const procedureId = thread.procedureId;
    let group = groups.get(procedureId);
    if (!group) {
      group = {
        procedureId,
        title: thread.procedure.title,
        organizerName: thread.procedure.organizer.name,
        isOrganizer: thread.procedure.organizerId === companyId,
        participantThreadIds: new Set(),
        chatThreadIds: new Set(),
        singleThreadId: null,
        lastMessageAt: null,
      };
      groups.set(procedureId, group);
    }
    if (thread.type === "PARTICIPANT") {
      group.participantThreadIds.add(thread.id);
      if (!group.isOrganizer) group.singleThreadId = thread.id;
    }
    if (thread.type === "PARTICIPANT" || thread.type === "SYSTEM") {
      group.chatThreadIds.add(thread.id);
    }
    if (lastMessageAt && (!group.lastMessageAt || lastMessageAt > group.lastMessageAt)) {
      group.lastMessageAt = lastMessageAt;
    }
  }

  const groupRows: InboxRow[] = [...groups.values()].map((g) => ({
    kind: "procedureGroup",
    procedureId: g.procedureId,
    title: g.title,
    organizerName: g.organizerName,
    chatCount: g.chatThreadIds.size,
    isOrganizer: g.isOrganizer,
    singleThreadId: g.singleThreadId,
    lastMessageAt: g.lastMessageAt,
  }));

  const kindOrder = (r: InboxRow) => (r.kind === "thread" ? (r.type === "AI" ? 0 : 1) : 2);
  const allRows = [...flatRows, ...groupRows];
  allRows.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    const orderDiff = kindOrder(a) - kindOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return a.title.localeCompare(b.title);
  });

  return allRows;
}

async function requireThreadAccess(threadId: string) {
  const { membership } = await requireCompany();
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    include: { procedure: { select: { organizerId: true } } },
  });
  if (!thread) throw new Error("Тред не найден");

  const companyId = membership.companyId;
  const hasAccess = thread.companyId === companyId || thread.procedure?.organizerId === companyId;
  if (!hasAccess) throw new Error("Тред не найден");

  return thread;
}

export async function getThreadMessages(threadId: string): Promise<MessageDTO[]> {
  await requireThreadAccess(threadId);

  const messages = await db.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true } } },
  });

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    senderId: m.senderId,
    senderName: m.sender?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function sendMessage(threadId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Пустое сообщение");

  const { user } = await requireCompany();
  const thread = await requireThreadAccess(threadId);
  if (thread.type === "SYSTEM") throw new Error("В этом треде нельзя писать");

  await db.message.create({ data: { threadId, senderId: user.id, content: trimmed } });

  if (thread.type === "AI" && thread.companyId) {
    const recent = await db.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const history = recent.map((m) => ({
      role: m.senderId === null ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    const reply = await generateCompanyAssistantReply(thread.companyId, history);
    await db.message.create({ data: { threadId, senderId: null, content: reply } });
  }
}

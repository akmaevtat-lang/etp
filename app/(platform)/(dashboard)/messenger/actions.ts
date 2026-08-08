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
// on procedures it organizes.
export async function listThreads(): Promise<ThreadListItem[]> {
  const { membership } = await requireCompany();
  const companyId = membership.companyId;

  const threads = await db.thread.findMany({
    where: {
      OR: [{ companyId }, { procedure: { organizerId: companyId } }],
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
      title = "Уведомления";
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

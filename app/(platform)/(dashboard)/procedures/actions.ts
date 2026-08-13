"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureParticipantThread, logProcedureEvent } from "@/lib/messenger";
import type { ProcedureStatus, SpecificationItem } from "@prisma/client";

async function actorName(userId: string) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  return u?.name ?? "Кто-то";
}

export async function createProcedure(formData: FormData) {
  const { user, membership } = await requireCompany();

  const type = formData.get("type") as "PURCHASE" | "SALE";
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;

  const procedure = await db.procedure.create({
    data: {
      organizerId: membership.companyId,
      createdById: user.id,
      type,
      title,
      description,
    },
  });

  const name = await actorName(user.id);
  await logProcedureEvent(procedure.id, `${name}: процедура создана`);

  redirect(`/procedures/${procedure.id}`);
}

// "Закупка" in the create-procedure dropdown — skips the separate title/
// description form and drops the organizer straight into an editable draft
// (per user request 2026-08-09: "открывался сразу черновик, который можно
// заполнить"), title/description/etc. get filled in on the draft page itself.
export async function createDraftPurchase() {
  const { user, membership } = await requireCompany();

  const procedure = await db.procedure.create({
    data: {
      organizerId: membership.companyId,
      createdById: user.id,
      type: "PURCHASE",
      title: "Новая закупка",
    },
  });

  const name = await actorName(user.id);
  await logProcedureEvent(procedure.id, `${name}: процедура создана`);

  redirect(`/procedures/${procedure.id}`);
}

// Backs both "Сохранить как черновик" and the save-then-publish step of
// "Опубликовать" on the single-page procedure overview (2026-08-09 redesign,
// replaces the old always-read-only "Общая информация" tab).
export async function updateProcedureDraft(
  procedureId: string,
  data: {
    title: string;
    description: string;
    deliveryRegion: string;
    deadlineAt: string;
    winnerSelectionAt: string;
  },
) {
  const procedure = await requireOwnedProcedure(procedureId);
  if (procedure.status !== "DRAFT") throw new Error("Процедуру можно редактировать только в статусе черновика");

  const title = data.title.trim();
  if (!title) throw new Error("Укажите наименование");

  await db.procedure.update({
    where: { id: procedureId },
    data: {
      title,
      description: data.description.trim() || null,
      deliveryRegion: data.deliveryRegion.trim() || null,
      deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
      winnerSelectionAt: data.winnerSelectionAt ? new Date(data.winnerSelectionAt) : null,
    },
  });

  revalidatePath(`/procedures/${procedureId}`);
}

// Loaded once per action call rather than cached, since callers each need a
// fresh check that the active company still owns this procedure.
async function requireOwnedProcedure(procedureId: string) {
  const { membership } = await requireCompany();
  const procedure = await db.procedure.findUnique({ where: { id: procedureId } });
  if (!procedure || procedure.organizerId !== membership.companyId) {
    throw new Error("Процедура не найдена");
  }
  return procedure;
}

function serializeItem(item: SpecificationItem) {
  return {
    id: item.id,
    procedureId: item.procedureId,
    lotNumber: item.lotNumber,
    name: item.name,
    qty: Number(item.qty),
    unit: item.unit,
    vatRate: Number(item.vatRate),
    priceNoVat: Number(item.priceNoVat),
    priceWithVat: Number(item.priceWithVat),
    totalNoVat: Number(item.totalNoVat),
    totalWithVat: Number(item.totalWithVat),
    characteristics: item.characteristics ?? "",
    deliveryTerms: item.deliveryTerms ?? "",
  };
}

export type SpecificationItemDTO = ReturnType<typeof serializeItem>;

export async function addSpecificationItem(procedureId: string) {
  await requireOwnedProcedure(procedureId);

  const last = await db.specificationItem.findFirst({
    where: { procedureId },
    orderBy: { lotNumber: "desc" },
  });

  const item = await db.specificationItem.create({
    data: {
      procedureId,
      lotNumber: (last?.lotNumber ?? 0) + 1,
      name: "",
      qty: 1,
      unit: "",
      vatRate: 20,
      priceNoVat: 0,
      priceWithVat: 0,
      totalNoVat: 0,
      totalWithVat: 0,
    },
  });

  revalidatePath(`/procedures/${procedureId}`);
  return serializeItem(item);
}

export async function updateSpecificationItem(
  id: string,
  input: {
    lotNumber: number;
    name: string;
    qty: number;
    unit: string;
    vatRate: number;
    priceNoVat: number;
    characteristics: string;
    deliveryTerms: string;
  },
) {
  const existing = await db.specificationItem.findUnique({
    where: { id },
    include: { procedure: true },
  });
  if (!existing) throw new Error("Позиция не найдена");
  const { membership } = await requireCompany();
  if (existing.procedure.organizerId !== membership.companyId) {
    throw new Error("Позиция не найдена");
  }

  const priceWithVat = input.priceNoVat * (1 + input.vatRate / 100);
  const totalNoVat = input.qty * input.priceNoVat;
  const totalWithVat = input.qty * priceWithVat;

  const item = await db.specificationItem.update({
    where: { id },
    data: {
      lotNumber: input.lotNumber,
      name: input.name,
      qty: input.qty,
      unit: input.unit,
      vatRate: input.vatRate,
      priceNoVat: input.priceNoVat,
      priceWithVat,
      totalNoVat,
      totalWithVat,
      characteristics: input.characteristics || null,
      deliveryTerms: input.deliveryTerms || null,
    },
  });

  revalidatePath(`/procedures/${existing.procedureId}`);
  return serializeItem(item);
}

export async function deleteSpecificationItem(id: string) {
  const existing = await db.specificationItem.findUnique({
    where: { id },
    include: { procedure: true },
  });
  if (!existing) throw new Error("Позиция не найдена");
  const { membership } = await requireCompany();
  if (existing.procedure.organizerId !== membership.companyId) {
    throw new Error("Позиция не найдена");
  }

  await db.specificationItem.delete({ where: { id } });
  revalidatePath(`/procedures/${existing.procedureId}`);
}

// Раздел 7 ТЗ_ЗАКУПКИ: на этапе PUBLISHED участник построчно повторяет
// структуру спецификации организатора своими ценами. round=1 — переторжка
// (round 2+) отдельная будущая задача, схема уже её поддерживает.
export async function submitProposalWithItems(
  procedureId: string,
  items: { specificationItemId: string; price: number; comment: string }[],
) {
  const { user, membership } = await requireCompany();
  const companyId = membership.companyId;

  const procedure = await db.procedure.findUnique({ where: { id: procedureId } });
  if (!procedure) throw new Error("Процедура не найдена");
  if (procedure.organizerId === companyId) throw new Error("Нельзя подать заявку на свою процедуру");
  if (procedure.status !== "PUBLISHED") throw new Error("Приём заявок сейчас недоступен");

  const existing = await db.proposal.findUnique({
    where: { procedureId_companyId_round: { procedureId, companyId, round: 1 } },
  });
  if (existing) throw new Error("Заявка уже подана");

  const specItems = await db.specificationItem.findMany({ where: { procedureId } });
  if (specItems.length === 0) throw new Error("В процедуре нет позиций спецификации");

  const specItemIds = new Set(specItems.map((s) => s.id));
  if (items.length !== specItems.length || items.some((i) => !specItemIds.has(i.specificationItemId))) {
    throw new Error("Список позиций не соответствует спецификации");
  }
  if (items.some((i) => !(i.price > 0))) throw new Error("Укажите цену по каждой позиции");

  await db.proposal.create({
    data: {
      procedureId,
      companyId,
      round: 1,
      items: {
        create: items.map((i) => ({
          specificationItemId: i.specificationItemId,
          price: i.price,
          comment: i.comment.trim() || null,
        })),
      },
    },
  });

  const name = await actorName(user.id);
  await logProcedureEvent(procedureId, `${name} (${membership.company.name}): подана заявка на участие`);

  await ensureParticipantThread(procedureId, companyId);
  revalidatePath(`/procedures/${procedureId}`);
}

// Favorite is personal to the user (like a bookmark), not shared by the
// whole company — matches the Bidzaar reference in docs/TZ_ZAKUPKI.md.
export async function toggleFavorite(procedureId: string) {
  const { user } = await requireCompany();

  const existing = await db.favorite.findUnique({
    where: { userId_procedureId: { userId: user.id, procedureId } },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
  } else {
    await db.favorite.create({ data: { userId: user.id, procedureId } });
  }

  revalidatePath("/procedures");
  revalidatePath("/participation");
  revalidatePath("/marketplace/purchases");
  revalidatePath("/marketplace/sales");
}

// Only ever offered on DRAFT cards (nothing else has real participants/docs
// yet to worry about losing) — still cleans up every dependent row by hand
// since none of the procedureId relations cascade in the schema.
export async function deleteProcedure(procedureId: string) {
  const procedure = await requireOwnedProcedure(procedureId);
  if (procedure.status !== "DRAFT") throw new Error("Удалить можно только черновик");

  await db.$transaction(async (tx) => {
    const threads = await tx.thread.findMany({ where: { procedureId }, select: { id: true } });
    const threadIds = threads.map((t) => t.id);
    if (threadIds.length > 0) {
      await tx.message.deleteMany({ where: { threadId: { in: threadIds } } });
      await tx.thread.deleteMany({ where: { id: { in: threadIds } } });
    }

    const checklists = await tx.checklist.findMany({ where: { procedureId }, select: { id: true } });
    const checklistIds = checklists.map((c) => c.id);
    if (checklistIds.length > 0) {
      await tx.checklistItem.deleteMany({ where: { checklistId: { in: checklistIds } } });
      await tx.checklist.deleteMany({ where: { id: { in: checklistIds } } });
    }

    const proposals = await tx.proposal.findMany({ where: { procedureId }, select: { id: true } });
    const proposalIds = proposals.map((p) => p.id);
    if (proposalIds.length > 0) {
      await tx.proposalItem.deleteMany({ where: { proposalId: { in: proposalIds } } });
      await tx.proposal.deleteMany({ where: { id: { in: proposalIds } } });
    }

    await tx.specificationItem.deleteMany({ where: { procedureId } });
    await tx.document.deleteMany({ where: { procedureId } });
    await tx.favorite.deleteMany({ where: { procedureId } });

    await tx.procedure.delete({ where: { id: procedureId } });
  });

  revalidatePath("/procedures");
  revalidatePath("/participation");
  revalidatePath("/marketplace/purchases");
  revalidatePath("/marketplace/sales");
}

// ---------- Статус-контрол (раздел 3 ТЗ_ЗАКУПКИ — переходы-кнопки, не dropdown) ----------

const STATUS_TRANSITIONS = {
  publish: { from: "DRAFT", to: "PUBLISHED" },
  startRetrade: { from: "PUBLISHED", to: "RETRADE" },
  goToWinnerSelection: { from: ["PUBLISHED", "RETRADE"], to: "WINNER_SELECTION" },
  complete: { from: "WINNER_SELECTION", to: "COMPLETED" },
  openDocuments: { from: "COMPLETED", to: "DOCUMENTS" },
} as const;

export type StatusTransitionAction = keyof typeof STATUS_TRANSITIONS;

const TRANSITION_LOG_TEXT: Record<StatusTransitionAction, string> = {
  publish: "процедура опубликована",
  startRetrade: "начата переторжка",
  goToWinnerSelection: "начат выбор победителя",
  complete: "процедура завершена",
  openDocuments: "открыт документооборот",
};

export async function transitionProcedureStatus(procedureId: string, action: StatusTransitionAction) {
  const { user } = await requireCompany();
  const procedure = await requireOwnedProcedure(procedureId);
  const transition = STATUS_TRANSITIONS[action];
  const allowedFrom: ProcedureStatus[] = Array.isArray(transition.from) ? [...transition.from] : [transition.from];

  if (!allowedFrom.includes(procedure.status)) {
    throw new Error("Недопустимый переход статуса");
  }

  // Номер присваивается только теперь, при первой публикации — черновики его
  // не имеют (раздел ТЗ). MAX+1 вместо БД-сиквенса — проще, а конкурентные
  // публикации в этом MVP не настолько часты, чтобы гонка была реальной проблемой.
  let number: number | undefined;
  if (action === "publish" && procedure.number === null) {
    const { _max } = await db.procedure.aggregate({ _max: { number: true } });
    number = (_max.number ?? 0) + 1;
  }

  await db.procedure.update({
    where: { id: procedureId },
    data: {
      status: transition.to,
      ...(action === "publish" ? { publishedAt: new Date() } : {}),
      ...(number !== undefined ? { number } : {}),
    },
  });

  // Раздел 3 ТЗ_ЗАКУПКИ: "Каждый переход пишет структурированное системное
  // сообщение в тред SYSTEM этой процедуры" — лог, не разовое событие.
  const name = await actorName(user.id);
  await logProcedureEvent(procedureId, `${name}: ${TRANSITION_LOG_TEXT[action]}`);

  revalidatePath(`/procedures/${procedureId}`);
}

// ---------- Чек-лист (раздел 6 ТЗ_ЗАКУПКИ — единственный реальный доп.блок в MVP) ----------

export async function createChecklist(procedureId: string, title: string) {
  const { user } = await requireCompany();
  await requireOwnedProcedure(procedureId);
  if (!title.trim()) throw new Error("Название не может быть пустым");

  const checklist = await db.checklist.create({
    data: { procedureId, title: title.trim() },
  });

  const name = await actorName(user.id);
  await logProcedureEvent(procedureId, `${name}: добавлен чек-лист «${checklist.title}»`);

  revalidatePath(`/procedures/${procedureId}`);
  return checklist;
}

async function requireOwnedChecklist(checklistId: string) {
  const checklist = await db.checklist.findUnique({
    where: { id: checklistId },
    include: { procedure: true },
  });
  if (!checklist) throw new Error("Чек-лист не найден");
  const { membership } = await requireCompany();
  if (checklist.procedure.organizerId !== membership.companyId) throw new Error("Чек-лист не найден");
  return checklist;
}

export async function addChecklistItem(checklistId: string, content: string) {
  const { user } = await requireCompany();
  const checklist = await requireOwnedChecklist(checklistId);
  if (!content.trim()) throw new Error("Пункт не может быть пустым");

  const last = await db.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { order: "desc" },
  });

  const item = await db.checklistItem.create({
    data: { checklistId, content: content.trim(), order: (last?.order ?? -1) + 1 },
  });

  const name = await actorName(user.id);
  await logProcedureEvent(checklist.procedureId, `${name}: добавлен пункт чек-листа «${item.content}»`);

  revalidatePath(`/procedures/${checklist.procedureId}`);
  return item;
}

export async function toggleChecklistItem(itemId: string) {
  const item = await db.checklistItem.findUnique({
    where: { id: itemId },
    include: { checklist: { include: { procedure: true } } },
  });
  if (!item) throw new Error("Пункт не найден");
  const { user, membership } = await requireCompany();
  if (item.checklist.procedure.organizerId !== membership.companyId) throw new Error("Пункт не найден");

  const nextDone = !item.isDone;
  await db.checklistItem.update({ where: { id: itemId }, data: { isDone: nextDone } });

  const name = await actorName(user.id);
  const verb = nextDone ? "отметил(а) выполненным" : "снял(а) отметку с";
  await logProcedureEvent(item.checklist.procedureId, `${name}: ${verb} пункт «${item.content}»`);

  revalidatePath(`/procedures/${item.checklist.procedureId}`);
}

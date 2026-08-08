"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureParticipantThread } from "@/lib/messenger";
import type { SpecificationItem } from "@prisma/client";

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

  redirect(`/procedures/${procedure.id}`);
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

// Minimal placeholder for the real "submit a proposal" flow (per-lot pricing
// form) — that's a separate future task. This just records that the company
// applied (round=1, no items yet) so a PARTICIPANT chat thread with the
// organizer can be created, per docs/PROJECT_BRIEF.md "Мессенджер — детализация".
export async function submitProposal(procedureId: string) {
  const { membership } = await requireCompany();
  const companyId = membership.companyId;

  const procedure = await db.procedure.findUnique({ where: { id: procedureId } });
  if (!procedure) throw new Error("Процедура не найдена");
  if (procedure.organizerId === companyId) throw new Error("Нельзя подать заявку на свою процедуру");
  if (procedure.status === "DRAFT") throw new Error("Процедура ещё не опубликована");

  const existing = await db.proposal.findUnique({
    where: { procedureId_companyId_round: { procedureId, companyId, round: 1 } },
  });
  if (!existing) {
    await db.proposal.create({ data: { procedureId, companyId, round: 1 } });
  }

  await ensureParticipantThread(procedureId, companyId);
  revalidatePath(`/procedures/${procedureId}`);
}

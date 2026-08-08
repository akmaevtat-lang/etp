import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Called right after a company is created (onboarding or the sidebar's
// "create additional company" flow) so every company starts with its two
// default chats, per docs/PROJECT_BRIEF.md "Мессенджер — детализация".
export async function ensureCompanyDefaultThreads(
  companyId: string,
  client: Prisma.TransactionClient | typeof db = db,
) {
  const existing = await client.thread.findMany({
    where: { companyId, procedureId: null, type: { in: ["AI", "SYSTEM"] } },
    select: { type: true },
  });
  const existingTypes = new Set(existing.map((t) => t.type));

  const toCreate: Prisma.ThreadCreateManyInput[] = [];
  if (!existingTypes.has("AI")) toCreate.push({ companyId, type: "AI" });
  if (!existingTypes.has("SYSTEM")) toCreate.push({ companyId, type: "SYSTEM" });

  if (toCreate.length > 0) {
    await client.thread.createMany({ data: toCreate });
  }
}

// Called when a company submits a proposal for a procedure — one
// PARTICIPANT thread per (procedure, participant company) pair.
export async function ensureParticipantThread(procedureId: string, participantCompanyId: string) {
  const existing = await db.thread.findFirst({
    where: { procedureId, companyId: participantCompanyId, type: "PARTICIPANT" },
  });
  if (existing) return existing;

  return db.thread.create({
    data: { procedureId, companyId: participantCompanyId, type: "PARTICIPANT" },
  });
}

// Called when a procedure is created — the thread structured status/checklist
// log messages land in (docs/TZ_ZAKUPKI.md §3: "каждый переход пишет
// структурированное системное сообщение в тред SYSTEM этой процедуры").
// Distinct from the per-company SYSTEM thread (ensureCompanyDefaultThreads).
export async function ensureProcedureSystemThread(procedureId: string) {
  const existing = await db.thread.findFirst({
    where: { procedureId, type: "SYSTEM" },
  });
  if (existing) return existing;

  return db.thread.create({
    data: { procedureId, type: "SYSTEM" },
  });
}

// Writes one structured log line to the procedure's SYSTEM thread. Content
// is a plain string (e.g. "Иван Иванов: процедура опубликована") — no rich
// card format yet, that's a later refinement once we need it.
export async function logProcedureEvent(procedureId: string, content: string) {
  const thread = await ensureProcedureSystemThread(procedureId);
  await db.message.create({ data: { threadId: thread.id, senderId: null, content } });
}

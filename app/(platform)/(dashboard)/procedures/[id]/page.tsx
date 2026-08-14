import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { StatusControl } from "@/components/procedure/status-control";
import { ProcedureExtraBlocks } from "@/components/procedure/procedure-extra-blocks";
import { ProcedureDraftEditor } from "@/components/procedure/procedure-draft-editor";
import { MessengerProcedureScope } from "@/components/messenger/messenger-procedure-scope";
import { StatusBadge } from "@/components/procedure/status-badge";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Закупка",
  SALE: "Продажа",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(date: Date) {
  const datePart = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

function pluralizeItems(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "позиции";
  return "позиций";
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

// Label above value, not side-by-side — matches ProcedureDraftEditor's
// Label-above-Input layout for the same fields, so leaving DRAFT doesn't
// reshuffle where Наименование/Описание/Место поставки sit on the page.
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { membership } = await requireCompany();
  const { id } = await params;

  const procedure = await db.procedure.findUnique({
    where: { id },
    include: {
      specifications: { orderBy: [{ lotNumber: "asc" }, { id: "asc" }], select: { id: true, name: true } },
      organizer: { select: { name: true } },
      createdBy: { select: { name: true } },
      checklists: { include: { items: { orderBy: { order: "asc" } } }, take: 1 },
    },
  });

  const isOrganizer = procedure?.organizerId === membership.companyId;
  // Non-organizers can only see procedures once they're actually published —
  // drafts stay private to the organizing company.
  if (!procedure || (!isOrganizer && procedure.status === "DRAFT")) notFound();

  const participantCount = isOrganizer
    ? await db.proposal.count({ where: { procedureId: procedure.id, round: 1 } })
    : 0;

  const checklist = procedure.checklists[0]
    ? {
        id: procedure.checklists[0].id,
        title: procedure.checklists[0].title,
        items: procedure.checklists[0].items.map((i) => ({ id: i.id, content: i.content, isDone: i.isDone })),
      }
    : null;

  const isDraft = procedure.status === "DRAFT";
  const editable = isDraft && isOrganizer;

  return (
    <>
      <SiteHeader title={procedure.title} />
      <div className="flex max-w-[500px] flex-col gap-6 p-4">
        <MessengerProcedureScope procedureId={procedure.id} title={procedure.title} />

        <h1 className="text-xl font-semibold">{procedure.title}</h1>

        {editable ? (
          <ProcedureDraftEditor
            procedureId={procedure.id}
            initial={{
              title: procedure.title,
              description: procedure.description ?? "",
              deliveryRegion: procedure.deliveryRegion ?? "",
              deadlineAt: procedure.deadlineAt?.toISOString() ?? null,
              winnerSelectionAt: procedure.winnerSelectionAt?.toISOString() ?? null,
            }}
            meta={{
              companyName: procedure.organizer.name,
              createdByName: procedure.createdBy?.name ?? "—",
              typeLabel: TYPE_LABELS[procedure.type],
            }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {isOrganizer && <StatusControl procedureId={procedure.id} status={procedure.status} />}

            <div className="divide-y rounded-lg bg-card shadow-sm">
              <FieldRow label="Наименование" value={procedure.title} />
              <FieldRow label="Описание" value={procedure.description || "—"} />
              <FieldRow
                label="Место поставки"
                value={procedure.deliveryRegion || <span className="text-muted-foreground">Указано в спецификации</span>}
              />
            </div>

            <div className="divide-y rounded-lg bg-card shadow-sm">
              <MetaRow label="Компания" value={procedure.organizer.name} />
              <MetaRow label="Сотрудник" value={procedure.createdBy?.name ?? "—"} />
              <MetaRow label="Тип" value={TYPE_LABELS[procedure.type]} />
              <MetaRow label="Статус" value={<StatusBadge status={procedure.status} />} />
              <MetaRow label="Номер заявки" value={procedure.number ?? "—"} />
              <MetaRow
                label="Дата публикации"
                value={procedure.publishedAt ? formatDate(procedure.publishedAt) : "—"}
              />
              <MetaRow
                label="Приём заявок до"
                value={procedure.deadlineAt ? formatDateTime(procedure.deadlineAt) : "—"}
              />
              <MetaRow
                label="Дата выбора победителя"
                value={procedure.winnerSelectionAt ? formatDateTime(procedure.winnerSelectionAt) : "—"}
              />
              <MetaRow label="Валюта запроса" value="Российский рубль" />
              {isOrganizer && <MetaRow label="Участников" value={participantCount} />}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-sm">
          <div>
            <p className="font-medium">Спецификация</p>
            <p className="text-sm text-muted-foreground">
              {procedure.specifications.length === 0
                ? "Пока нет спецификаций"
                : `${procedure.specifications.length} ${pluralizeItems(procedure.specifications.length)}`}
            </p>
          </div>
          {procedure.specifications.length > 0 && (
            <div className="divide-y rounded-lg bg-card shadow-sm">
              {procedure.specifications.map((item) => (
                <div key={item.id} className="px-4 py-2.5 text-sm">
                  {item.name || "—"}
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            nativeButton={false}
            render={<Link href={`/procedures/${procedure.id}/specification`} />}
          >
            {editable ? "Редактировать" : "Открыть"}
          </Button>
        </div>

        {isOrganizer && <ProcedureExtraBlocks procedureId={procedure.id} checklist={checklist} />}
      </div>
    </>
  );
}

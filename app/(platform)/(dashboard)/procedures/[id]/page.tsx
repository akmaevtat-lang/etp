import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SpecificationTable } from "@/components/procedure/specification-table";
import { ProposalForm } from "@/components/procedure/proposal-form";
import { ProposalList } from "@/components/procedure/proposal-list";
import { LifecycleStepper } from "@/components/procedure/lifecycle-stepper";
import { StatusControl } from "@/components/procedure/status-control";
import { ProcedureExtraBlocks } from "@/components/procedure/procedure-extra-blocks";
import { MessengerProcedureScope } from "@/components/messenger/messenger-procedure-scope";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Закупка",
  SALE: "Продажа",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
      specifications: { orderBy: [{ lotNumber: "asc" }, { id: "asc" }] },
      organizer: { select: { name: true } },
      createdBy: { select: { name: true } },
      checklists: { include: { items: { orderBy: { order: "asc" } } }, take: 1 },
    },
  });

  const isOrganizer = procedure?.organizerId === membership.companyId;
  // Non-organizers can only see procedures once they're actually published —
  // drafts stay private to the organizing company.
  if (!procedure || (!isOrganizer && procedure.status === "DRAFT")) notFound();

  const existingProposal = isOrganizer
    ? null
    : await db.proposal.findUnique({
        where: {
          procedureId_companyId_round: {
            procedureId: procedure.id,
            companyId: membership.companyId,
            round: 1,
          },
        },
        include: { items: true },
      });

  const organizerProposals = isOrganizer
    ? await db.proposal.findMany({
        where: { procedureId: procedure.id, round: 1 },
        include: { company: { select: { name: true } } },
        orderBy: { submittedAt: "asc" },
      })
    : [];

  const items = procedure.specifications.map((item) => ({
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
  }));

  const checklist = procedure.checklists[0]
    ? {
        id: procedure.checklists[0].id,
        title: procedure.checklists[0].title,
        items: procedure.checklists[0].items.map((i) => ({ id: i.id, content: i.content, isDone: i.isDone })),
      }
    : null;

  return (
    <>
      <SiteHeader title={procedure.title} />
      <div className="flex flex-col gap-6 p-4">
        <MessengerProcedureScope procedureId={procedure.id} />

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">
            {procedure.number} · {procedure.title}
          </h1>
          <Badge variant="secondary">{TYPE_LABELS[procedure.type]}</Badge>
        </div>

        <LifecycleStepper status={procedure.status} />

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Общая информация</TabsTrigger>
            <TabsTrigger value="specification">Спецификация</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex flex-col gap-4 pt-4">
            {!isOrganizer && existingProposal && (
              <div>
                <Badge variant="secondary">Заявка подана</Badge>
              </div>
            )}

            {isOrganizer && <StatusControl procedureId={procedure.id} status={procedure.status} />}

            <div className="divide-y rounded-lg border">
              <MetaRow label="Наименование" value={procedure.title} />
              <MetaRow label="Описание" value={procedure.description || "—"} />
              <MetaRow label="Компания" value={procedure.organizer.name} />
              <MetaRow label="Создал" value={procedure.createdBy?.name ?? "—"} />
              <MetaRow
                label="Дата публикации"
                value={procedure.publishedAt ? formatDate(procedure.publishedAt) : "—"}
              />
              <MetaRow
                label="Дата выбора победителя"
                value={procedure.winnerSelectionAt ? formatDate(procedure.winnerSelectionAt) : "—"}
              />
            </div>

            {isOrganizer && <ProcedureExtraBlocks procedureId={procedure.id} checklist={checklist} />}
          </TabsContent>

          <TabsContent value="specification" className="flex flex-col gap-6 pt-4">
            <Card>
              <CardContent>
                <SpecificationTable
                  procedureId={procedure.id}
                  initialItems={items}
                  editable={procedure.status === "DRAFT"}
                />
              </CardContent>
            </Card>

            {isOrganizer && procedure.status !== "DRAFT" && (
              <Card>
                <CardContent>
                  <ProposalList
                    proposals={organizerProposals.map((p) => ({
                      id: p.id,
                      companyName: p.company.name,
                      submittedAt: p.submittedAt,
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {!isOrganizer && procedure.status !== "DRAFT" && (
              <Card>
                <CardContent>
                  <ProposalForm
                    procedureId={procedure.id}
                    specItems={items.map((i) => ({
                      id: i.id,
                      lotNumber: i.lotNumber,
                      name: i.name,
                      qty: i.qty,
                      unit: i.unit,
                    }))}
                    existingItems={
                      existingProposal
                        ? existingProposal.items.map((i) => ({
                            specificationItemId: i.specificationItemId,
                            price: Number(i.price),
                            comment: i.comment,
                          }))
                        : null
                    }
                    canSubmit={procedure.status === "PUBLISHED"}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="pt-4">
            <p className="text-sm text-muted-foreground">
              Скоро здесь появится загрузка и просмотр файлов процедуры.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SpecificationTable } from "@/components/procedure/specification-table";
import { SubmitProposalButton } from "@/components/procedure/submit-proposal-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Закупка",
  SALE: "Продажа",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  RETRADE: "Переторжка",
  WINNER_SELECTION: "Выбор победителя",
  COMPLETED: "Завершено",
  DOCUMENTS: "Документооборот",
};

export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { membership } = await requireCompany();
  const { id } = await params;

  const procedure = await db.procedure.findUnique({
    where: { id },
    include: { specifications: { orderBy: [{ lotNumber: "asc" }, { id: "asc" }] } },
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
      });

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

  return (
    <>
      <SiteHeader title={procedure.title} />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{procedure.title}</h1>
          <Badge variant="secondary">{TYPE_LABELS[procedure.type]}</Badge>
          <Badge>{STATUS_LABELS[procedure.status]}</Badge>
        </div>
        {procedure.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{procedure.description}</p>
        )}
        {!isOrganizer && (
          <div>
            {existingProposal ? (
              <Badge variant="secondary">Заявка подана</Badge>
            ) : (
              <SubmitProposalButton procedureId={procedure.id} />
            )}
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Спецификация</CardTitle>
          </CardHeader>
          <CardContent>
            <SpecificationTable
              procedureId={procedure.id}
              initialItems={items}
              editable={procedure.status === "DRAFT"}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SpecificationTable } from "@/components/procedure/specification-table";
import { ProposalForm } from "@/components/procedure/proposal-form";
import { ProposalList } from "@/components/procedure/proposal-list";
import { MessengerProcedureScope } from "@/components/messenger/messenger-procedure-scope";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProcedureSpecificationPage({
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
    },
  });

  const isOrganizer = procedure?.organizerId === membership.companyId;
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

  return (
    <>
      <SiteHeader title={`${procedure.title} · Спецификация`} />
      <div className="flex flex-col gap-6 p-4">
        <MessengerProcedureScope procedureId={procedure.id} title={procedure.title} />

        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5"
          nativeButton={false}
          render={<Link href={`/procedures/${procedure.id}`} />}
        >
          <ArrowLeftIcon className="size-4" />
          {procedure.title}
        </Button>

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
      </div>
    </>
  );
}

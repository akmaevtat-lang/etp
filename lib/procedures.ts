import { db } from "@/lib/db";
import type { Prisma, ProcedureStatus, ProcedureType } from "@prisma/client";

export type ProcedureListScope = "mine" | "participation" | "marketplace";

export type ProcedureListFilters = {
  scope: ProcedureListScope;
  type?: ProcedureType;
  companyId: string;
  userId: string;
  search?: string;
  organizer?: string;
  region?: string;
  tags?: string[];
  statuses?: ProcedureStatus[];
  publishedFrom?: string;
  publishedTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  favoritesOnly?: boolean;
  sort?: "publishedAt" | "deadlineAt";
};

export type ProcedureListItem = {
  id: string;
  number: number;
  title: string;
  type: ProcedureType;
  status: ProcedureStatus;
  organizerName: string;
  organizerVerified: boolean;
  deliveryRegion: string | null;
  tags: string[];
  deadlineAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  lotCount: number;
  isFavorite: boolean;
};

function scopeConditions(
  scope: ProcedureListScope,
  companyId: string,
  type?: ProcedureType,
): Prisma.ProcedureWhereInput[] {
  if (scope === "mine") return [{ organizerId: companyId }];
  if (scope === "participation") return [{ proposals: { some: { companyId } } }];

  const conditions: Prisma.ProcedureWhereInput[] = [{ status: { not: "DRAFT" } }];
  if (type) conditions.push({ type });
  return conditions;
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

export async function listProcedures(
  filters: ProcedureListFilters,
): Promise<{ items: ProcedureListItem[]; total: number }> {
  const AND = scopeConditions(filters.scope, filters.companyId, filters.type);

  if (filters.search) AND.push({ title: { contains: filters.search, mode: "insensitive" } });
  if (filters.organizer) AND.push({ organizer: { name: filters.organizer } });
  if (filters.region) AND.push({ deliveryRegion: filters.region });
  if (filters.tags?.length) AND.push({ tags: { hasSome: filters.tags } });
  if (filters.statuses?.length) AND.push({ status: { in: filters.statuses } });

  const publishedAt = dateRange(filters.publishedFrom, filters.publishedTo);
  if (publishedAt) AND.push({ publishedAt });

  const deadlineAt = dateRange(filters.deadlineFrom, filters.deadlineTo);
  if (deadlineAt) AND.push({ deadlineAt });

  if (filters.favoritesOnly) AND.push({ favorites: { some: { userId: filters.userId } } });

  const where: Prisma.ProcedureWhereInput = { AND };
  const orderBy: Prisma.ProcedureOrderByWithRelationInput =
    filters.sort === "deadlineAt" ? { deadlineAt: "desc" } : { publishedAt: "desc" };

  const [rows, total] = await Promise.all([
    db.procedure.findMany({
      where,
      orderBy,
      include: {
        organizer: { select: { name: true, isVerified: true } },
        _count: { select: { specifications: true } },
        favorites: { where: { userId: filters.userId }, select: { id: true } },
      },
    }),
    db.procedure.count({ where }),
  ]);

  return {
    items: rows.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      type: p.type,
      status: p.status,
      organizerName: p.organizer.name,
      organizerVerified: p.organizer.isVerified,
      deliveryRegion: p.deliveryRegion,
      tags: p.tags,
      deadlineAt: p.deadlineAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      lotCount: p._count.specifications,
      isFavorite: p.favorites.length > 0,
    })),
    total,
  };
}

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseProcedureSearchParams(
  sp: SearchParams,
): Omit<ProcedureListFilters, "scope" | "type" | "companyId" | "userId"> {
  return {
    search: first(sp.q),
    organizer: first(sp.organizer),
    region: first(sp.region),
    tags: all(sp.tag),
    statuses: all(sp.status) as ProcedureStatus[],
    publishedFrom: first(sp.pubFrom),
    publishedTo: first(sp.pubTo),
    deadlineFrom: first(sp.dlFrom),
    deadlineTo: first(sp.dlTo),
    favoritesOnly: first(sp.fav) === "1",
    sort: first(sp.sort) === "deadlineAt" ? "deadlineAt" : "publishedAt",
  };
}

export async function getProcedureFilterOptions(
  scope: ProcedureListScope,
  companyId: string,
  type?: ProcedureType,
): Promise<{ organizers: string[]; regions: string[]; tags: string[] }> {
  const rows = await db.procedure.findMany({
    where: { AND: scopeConditions(scope, companyId, type) },
    select: { deliveryRegion: true, tags: true, organizer: { select: { name: true } } },
  });

  const organizers = Array.from(new Set(rows.map((r) => r.organizer.name))).sort();
  const regions = Array.from(
    new Set(rows.map((r) => r.deliveryRegion).filter((r): r is string => Boolean(r))),
  ).sort();
  const tags = Array.from(new Set(rows.flatMap((r) => r.tags))).sort();

  return { organizers, regions, tags };
}

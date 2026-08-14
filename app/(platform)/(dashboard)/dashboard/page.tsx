import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/procedure/status-badge";
import { SiteHeader } from "@/components/site-header";
import type { ProcedureType } from "@prisma/client";

const ACTIVE_STATUSES = ["PUBLISHED", "RETRADE", "WINNER_SELECTION"] as const;

function formatMoney(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

function formatDeadline(date: Date) {
  const datePart = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  const timePart = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysLabel = days <= 0 ? "сегодня" : `${days} ${pluralizeDays(days)}`;
  return `до ${datePart} · ${timePart} (${daysLabel})`;
}

function pluralizeDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}

// Одноразовое исключение для витринного демо-аккаунта: оригинальная
// абстрактная эмблема вместо серого плейсхолдера, чтобы карточка компании
// на скриншотах не выглядела пустой. Привязана к конкретному названию
// компании, не общая фича логотипов — в схеме поля под логотип нет.
function DemoCompanyMark() {
  return (
    <svg viewBox="0 0 80 80" className="size-20" role="img" aria-label="Логотип компании">
      <defs>
        <linearGradient id="demo-mark-bg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="16" fill="url(#demo-mark-bg)" />
      <circle cx="30" cy="34" r="20" fill="#ffffff" fillOpacity="0.9" />
      <circle cx="48" cy="50" r="16" fill="#22d3ee" fillOpacity="0.85" />
      <circle cx="52" cy="26" r="10" fill="#ffffff" fillOpacity="0.35" />
    </svg>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

type ActiveItem = { id: string; title: string; deadlineAt: Date | null; status: (typeof ACTIVE_STATUSES)[number] };

function ActiveProcedureList({
  title,
  count,
  items,
  emptyLabel,
}: {
  title: string;
  count: number;
  items: ActiveItem[];
  emptyLabel: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {count > 0 && (
          <CardAction>
            <Badge variant="secondary">{count}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/procedures/${item.id}`}
                className="flex flex-col gap-1.5 border-b py-3 first:pt-0 last:border-b-0 last:pb-0 hover:opacity-80"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.deadlineAt ? formatDeadline(item.deadlineAt) : "—"}
                </p>
                <div>
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            ))}
            {count > items.length && (
              <Link
                href="/procedures"
                className="pt-3 text-sm font-medium hover:underline"
              >
                Показать все →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function loadActiveList(companyId: string, type: ProcedureType) {
  const where = { organizerId: companyId, type, status: { in: [...ACTIVE_STATUSES] } };
  const [count, items] = await Promise.all([
    db.procedure.count({ where }),
    db.procedure.findMany({
      where,
      orderBy: { deadlineAt: "asc" },
      take: 3,
      select: { id: true, title: true, deadlineAt: true, status: true },
    }),
  ]);
  return { count, items: items as ActiveItem[] };
}

export default async function DashboardPage() {
  const { user, membership } = await requireCompany();
  const { company } = membership;
  const companyId = company.id;

  const [
    totalOrganizedCount,
    winnersSelectedCount,
    participatedProcedures,
    wonProcedures,
    draftCount,
    volumeAgg,
    favoritesCount,
    purchases,
    sales,
  ] = await Promise.all([
    db.procedure.count({ where: { organizerId: companyId } }),
    db.procedure.count({ where: { organizerId: companyId, proposals: { some: { isWinner: true } } } }),
    db.proposal.findMany({ where: { companyId }, select: { procedureId: true }, distinct: ["procedureId"] }),
    db.proposal.findMany({
      where: { companyId, isWinner: true },
      select: { procedureId: true },
      distinct: ["procedureId"],
    }),
    db.procedure.count({ where: { organizerId: companyId, status: "DRAFT" } }),
    db.specificationItem.aggregate({
      where: { procedure: { organizerId: companyId, status: { not: "DRAFT" } } },
      _sum: { totalWithVat: true },
    }),
    db.favorite.count({ where: { userId: user.id } }),
    loadActiveList(companyId, "PURCHASE"),
    loadActiveList(companyId, "SALE"),
  ]);

  const participatedCount = participatedProcedures.length;
  const wonCount = wonProcedures.length;
  const winnerRate = totalOrganizedCount > 0 ? Math.round((winnersSelectedCount / totalOrganizedCount) * 100) : null;
  const volume = Number(volumeAgg._sum.totalWithVat ?? 0);

  return (
    <>
      <SiteHeader title="Главная" />
      <div className="flex max-w-2xl flex-col gap-6 p-4">
        <Card className="rounded-lg">
          <CardContent className="flex flex-col gap-4">
            {company.name === "ООО Демо Показ" ? (
              <div className="size-20 overflow-hidden rounded-md">
                <DemoCompanyMark />
              </div>
            ) : (
              <div className="flex size-20 items-center justify-center rounded-md bg-muted">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{company.name}</h2>
              {company.isVerified && <Badge variant="secondary">Проверен</Badge>}
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              {company.description ? (
                <p className="text-sm">{company.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Описание компании пока не заполнено.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Показатели компании</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="divide-y">
                <StatRow label="Организовал процедур" value={totalOrganizedCount} />
                <StatRow
                  label="Выбрал победителей"
                  value={winnerRate !== null ? `${winnersSelectedCount} (${winnerRate}%)` : winnersSelectedCount}
                />
                <StatRow label="Участий" value={participatedCount} />
                <StatRow label="Побед" value={wonCount} />
              </div>
              <p className="mt-5 text-sm text-muted-foreground/70">Видно только вам:</p>
              <div className="divide-y">
                <StatRow label="Черновиков" value={draftCount} />
                <StatRow label="Объём организованных закупок" value={formatMoney(volume)} />
                <StatRow label="В избранном" value={favoritesCount} />
              </div>
            </div>
          </CardContent>
        </Card>

        <ActiveProcedureList
          title="Активные закупки"
          count={purchases.count}
          items={purchases.items}
          emptyLabel="Скоро здесь появятся закупки компании"
        />

        <ActiveProcedureList
          title="Активные продажи"
          count={sales.count}
          items={sales.items}
          emptyLabel="Скоро здесь появятся продажи компании"
        />

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Каталог товаров и услуг</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Скоро здесь появится каталог товаров и услуг компании.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

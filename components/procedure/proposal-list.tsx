import { Badge } from "@/components/ui/badge";

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ProposalList({
  proposals,
}: {
  proposals: { id: string; companyName: string; submittedAt: Date }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Подано заявок</p>
        <Badge variant="secondary">{proposals.length}</Badge>
      </div>
      {proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока никто не подал заявку.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {proposals.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="font-medium">{p.companyName}</span>
              <span className="text-muted-foreground">{formatDateTime(p.submittedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  StarIcon,
  BadgeCheckIcon,
  Building2Icon,
  MoreVerticalIcon,
  ExternalLinkIcon,
  LinkIcon,
  Trash2Icon,
} from "lucide-react";
import { toggleFavorite, deleteProcedure } from "@/app/(platform)/(dashboard)/procedures/actions";
import { StatusBadge } from "@/components/procedure/status-badge";
import type { ProcedureListItem } from "@/lib/procedures";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TYPE_LABELS: Record<string, string> = { PURCHASE: "Закупка", SALE: "Продажа" };

function formatDeadline(iso: string) {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysLabel =
    days < 0 ? "истёк" : days === 0 ? "сегодня" : `осталось ${days} ${pluralizeDays(days)}`;
  return `до ${datePart} · ${timePart} (${daysLabel})`;
}

function pluralizeDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}

export function ProcedureListCard({ item }: { item: ProcedureListItem }) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleToggleFavorite() {
    setIsFavorite((prev) => !prev);
    startTransition(async () => {
      try {
        await toggleFavorite(item.id);
      } catch {
        setIsFavorite((prev) => !prev);
      }
    });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/procedures/${item.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Ссылка скопирована"))
      .catch(() => toast.error("Не удалось скопировать ссылку"));
  }

  function handleDelete() {
    startDeleting(async () => {
      try {
        await deleteProcedure(item.id);
        setDeleteOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось удалить");
      }
    });
  }

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={handleToggleFavorite}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-amber-500"
        aria-pressed={isFavorite}
      >
        <StarIcon className={isFavorite ? "size-4 fill-amber-400 text-amber-400" : "size-4"} />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <Link href={`/procedures/${item.id}`} className="font-medium hover:underline">
          {item.title}
        </Link>

        <div className="!mt-1.5 flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
            <Building2Icon className="size-3" />
          </span>
          <span className="truncate">{item.organizerName}</span>
          {item.organizerVerified && <BadgeCheckIcon className="size-4 shrink-0 text-emerald-600" />}
        </div>

        <div>
          <StatusBadge status={item.status} />
        </div>

        {item.deadlineAt && (
          <p className="text-sm text-muted-foreground">Приём предложений {formatDeadline(item.deadlineAt)}</p>
        )}

        <p className="text-sm text-muted-foreground">
          {TYPE_LABELS[item.type]}
          {item.number !== null && ` №${item.number}`}
          {item.deliveryRegion && ` · ${item.deliveryRegion}`}
          {item.tags.length > 0 && ` · ${item.tags.join(", ")}`}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="shrink-0" />}>
          <MoreVerticalIcon className="size-4" />
          <span className="sr-only">Действия</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/procedures/${item.id}`} />}>
            <ExternalLinkIcon />
            Открыть
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <LinkIcon />
            Скопировать ссылку
          </DropdownMenuItem>
          {item.status === "DRAFT" && (
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              Удалить
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить черновик?</DialogTitle>
            <DialogDescription>
              «{item.title}» будет удалён без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

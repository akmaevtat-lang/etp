"use client";

import { useTransition } from "react";
import { ChevronDownIcon, ShoppingCartIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createDraftPurchase } from "@/app/(platform)/(dashboard)/procedures/actions";

export function CreateProcedureMenu() {
  const [isPending, startTransition] = useTransition();

  function handleCreatePurchase() {
    startTransition(async () => {
      await createDraftPurchase();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="gap-1.5" disabled={isPending} />}>
        {isPending ? "Создание..." : "Создать процедуру"}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCreatePurchase}>
          <ShoppingCartIcon />
          Закупка
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <TrendingUpIcon />
          Продажа
          <span className="ml-auto text-xs text-muted-foreground">Скоро</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

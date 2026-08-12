"use client";

import Link from "next/link";
import { ChevronDownIcon, ShoppingCartIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CreateProcedureMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="gap-1.5" />}>
        Создать процедуру
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/procedures/new" />}>
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

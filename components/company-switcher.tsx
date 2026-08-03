"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, LandmarkIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createAdditionalCompany, setActiveCompany } from "@/app/(platform)/actions";

export function CompanySwitcher({
  companies,
  activeCompanyId,
}: {
  companies: { id: string; name: string; inn: string }[];
  activeCompanyId: string;
}) {
  const { isMobile } = useSidebar();
  const [createOpen, setCreateOpen] = useState(false);
  const active = companies.find((c) => c.id === activeCompanyId) ?? companies[0]!;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LandmarkIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs">ИНН {active.inn}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                {companies.map((company) => (
                  <DropdownMenuItem
                    key={company.id}
                    onClick={() => setActiveCompany(company.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2",
                      company.id === active.id && "bg-muted",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{company.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ИНН {company.inn}
                      </span>
                    </div>
                    {company.id === active.id && <CheckIcon className="size-4 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
                  <PlusIcon className="size-4" />
                  Создать компанию
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая компания</DialogTitle>
            <DialogDescription>
              Заполните данные для создания новой организации.
            </DialogDescription>
          </DialogHeader>
          <form action={createAdditionalCompany} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-company-name">Название</Label>
              <Input id="new-company-name" name="name" placeholder="ООО Ромашка" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-company-inn">ИНН</Label>
              <Input id="new-company-inn" name="inn" placeholder="1234567890" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">Создать</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

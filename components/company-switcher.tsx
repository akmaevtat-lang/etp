"use client";

import { CheckIcon, ChevronsUpDownIcon, LandmarkIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setActiveCompany } from "@/app/(platform)/actions";

export function CompanySwitcher({
  companies,
  activeCompanyId,
}: {
  companies: { id: string; name: string; inn: string }[];
  activeCompanyId: string;
}) {
  const { isMobile } = useSidebar();
  const active = companies.find((c) => c.id === activeCompanyId) ?? companies[0]!;

  return (
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
            {companies.length > 1 && <ChevronsUpDownIcon className="ml-auto size-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Компании
              </DropdownMenuLabel>
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setActiveCompany(company.id)}
                  className="gap-2"
                >
                  <CheckIcon
                    className={company.id === active.id ? "opacity-100" : "opacity-0"}
                  />
                  <div className="flex flex-col">
                    <span>{company.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ИНН {company.inn}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

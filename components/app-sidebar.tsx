"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { CompanySwitcher } from "@/components/company-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({
  user,
  companies,
  activeCompanyId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string };
  companies: { id: string; name: string; inn: string }[];
  activeCompanyId: string;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

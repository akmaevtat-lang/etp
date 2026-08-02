"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, FileTextIcon, InboxIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Дашборд", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Процедуры", url: "/procedures/new", icon: FileTextIcon },
  { title: "Инбокс", url: "/inbox", icon: InboxIcon },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Платформа</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const section = "/" + item.url.split("/")[1];
          const isActive = pathname === item.url || pathname.startsWith(section + "/");
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<Link href={item.url} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

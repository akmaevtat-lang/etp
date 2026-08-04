"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClipboardListIcon,
  UsersIcon,
  MailIcon,
  InboxIcon,
  SettingsIcon,
  ShoppingCartIcon,
  BarChart3Icon,
  LayoutGridIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const mainItems = [
  { title: "Главная", url: "/dashboard", icon: HomeIcon },
  { title: "Мои процедуры", url: "/procedures", icon: ClipboardListIcon },
  { title: "Участие в процедурах", url: "/participation", icon: UsersIcon },
  { title: "Приглашения", url: "/invitations", icon: MailIcon },
  { title: "Заявки из каталога", url: "/catalog-requests", icon: InboxIcon },
];

const serviceItems = [
  { title: "Закупки", url: "/marketplace/purchases", icon: ShoppingCartIcon },
  { title: "Продажи", url: "/marketplace/sales", icon: BarChart3Icon },
  { title: "Каталог", url: "/marketplace/catalog", icon: LayoutGridIcon },
];

function isItemActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(url + "/");
}

export function NavMain() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isItemActive(pathname, item.url)}
                render={<Link href={item.url} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Настройки" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
              <span>Настройки</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="uppercase">Сервисы</SidebarGroupLabel>
        <SidebarMenu>
          {serviceItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isItemActive(pathname, item.url)}
                render={<Link href={item.url} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки</DialogTitle>
            <DialogDescription>
              Скоро здесь появятся настройки компании и аккаунта.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

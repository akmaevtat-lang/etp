import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MessengerProvider } from "@/components/messenger/messenger-provider";
import { MessengerPanel } from "@/components/messenger/messenger-panel";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership, memberships } = await requireCompany();
  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  return (
    <SidebarProvider>
      <MessengerProvider currentUserId={user.id}>
        <AppSidebar
          user={{ name: profile?.name ?? user.email ?? "", email: user.email ?? "" }}
          companies={memberships.map((m) => ({
            id: m.company.id,
            name: m.company.name,
            inn: m.company.inn,
          }))}
          activeCompanyId={membership.company.id}
        />
        <SidebarInset>{children}</SidebarInset>
        <MessengerPanel />
      </MessengerProvider>
    </SidebarProvider>
  );
}

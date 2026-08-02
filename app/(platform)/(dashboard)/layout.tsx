import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
    </SidebarProvider>
  );
}

import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership } = await requireCompany();
  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: profile?.name ?? user.email ?? "", email: user.email ?? "" }}
        company={{ name: membership.company.name, inn: membership.company.inn }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

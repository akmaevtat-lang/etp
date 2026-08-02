import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const ACTIVE_COMPANY_COOKIE = "active_company_id";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

// A user can belong to multiple companies (CompanyMember is many-to-many);
// the active one for the session is tracked via a cookie set by setActiveCompany,
// falling back to the first membership if none is set or it's no longer valid.
export async function requireCompany() {
  const user = await requireUser();
  const memberships = await db.companyMember.findMany({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) redirect("/onboarding/company");

  const activeCompanyId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.companyId === activeCompanyId) ?? memberships[0]!;

  return { user, membership, memberships };
}

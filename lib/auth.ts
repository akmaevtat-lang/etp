import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

export async function requireCompany() {
  const user = await requireUser();
  const membership = await db.companyMember.findFirst({
    where: { userId: user.id },
    include: { company: true },
  });

  if (!membership) redirect("/onboarding/company");
  return { user, membership };
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ACTIVE_COMPANY_COOKIE, requireUser } from "@/lib/auth";
import { ensureCompanyDefaultThreads } from "@/lib/messenger";

export async function setActiveCompany(companyId: string) {
  const user = await requireUser();

  const membership = await db.companyMember.findFirst({
    where: { userId: user.id, companyId },
  });
  if (!membership) return;

  (await cookies()).set(ACTIVE_COMPANY_COOKIE, companyId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCompany(formData: FormData) {
  const user = await requireUser();

  const name = formData.get("name") as string;
  const inn = formData.get("inn") as string;
  const description = (formData.get("description") as string) || null;

  const existing = await db.companyMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  const company = await db.company.create({
    data: {
      name,
      inn,
      description,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });
  await ensureCompanyDefaultThreads(company.id);

  redirect("/dashboard");
}

// Same as createCompany, but for a user who already belongs to at least one
// company — used by the sidebar's "Создать компанию" dialog, not onboarding.
export async function createAdditionalCompany(formData: FormData) {
  const user = await requireUser();

  const name = formData.get("name") as string;
  const inn = formData.get("inn") as string;

  const company = await db.company.create({
    data: {
      name,
      inn,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });
  await ensureCompanyDefaultThreads(company.id);

  (await cookies()).set(ACTIVE_COMPANY_COOKIE, company.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}

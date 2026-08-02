"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

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

  await db.company.create({
    data: {
      name,
      inn,
      description,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });

  redirect("/dashboard");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error || !data.user) {
    redirect(`/register?error=${encodeURIComponent(error?.message ?? "Не удалось создать аккаунт")}`);
  }

  // Prisma User.id mirrors the Supabase auth user id, so RLS policies
  // can key off auth.uid() without a separate mapping table.
  await db.user.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, name },
    update: { name },
  });

  if (!data.session) {
    redirect("/register/check-email");
  }

  redirect("/onboarding/company");
}

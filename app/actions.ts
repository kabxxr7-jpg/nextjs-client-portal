"use server";

import { redirect } from "next/navigation";
import { demoAccount } from "@/lib/demo";
import { demoPassword } from "@/lib/env";
import { safeNext } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: string } | undefined;

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match an account." };
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function demoSignIn(form: FormData): Promise<void> {
  const account = demoAccount(String(form.get("account") ?? ""));
  if (!account) redirect("/?error=unknown-account");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: demoPassword(),
  });
  if (error) redirect("/?error=demo-sign-in-failed");
  redirect("/portal");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  role: "client" | "admin";
  client_id: string | null;
  clients: { name: string } | null;
}

/** Signed-in user and profile, or null. Cached per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, client_id, clients(name)")
    .eq("id", auth.user.id)
    .single<Profile>();
  if (!profile) return null;
  return { supabase, user: auth.user, profile, isAdmin: profile.role === "admin" };
});

export async function requireViewer() {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

/** UI guard for admin screens. Writes are also refused by RLS for non-admins. */
export async function requireAdmin() {
  const v = await requireViewer();
  if (!v.isAdmin) redirect("/portal");
  return v;
}

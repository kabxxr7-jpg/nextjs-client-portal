"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { checkStatusBody, checkUpload, isUuid, safeFileName, storagePath } from "@/lib/validate";
import type { FormState } from "@/app/actions";

// Each action checks the role for a clear error message, but the real guard is Postgres:
// RLS refuses these writes for anyone whose profile is not an admin.

export async function postStatus(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const projectId = form.get("project_id");
  if (!isUuid(projectId)) return { error: "Pick a project." };
  const body = checkStatusBody(form.get("body"));
  if (!body.ok) return { error: body.error };
  // client_id is filled in from the project by a database trigger
  const { error } = await supabase
    .from("status_updates")
    .insert({ project_id: projectId, body: body.value, author_id: user.id });
  if (error) return { error: "Could not post the update." };
  revalidatePath("/portal", "layout");
  return { ok: "Update posted. The client sees it now." };
}

export async function uploadFile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const projectId = form.get("project_id");
  if (!isUuid(projectId)) return { error: "Pick a project." };
  const file = form.get("file");
  const f = file instanceof File ? file : null;
  const check = checkUpload(f);
  if (!check.ok || !f) return { error: check.ok ? "Choose a file." : check.error };

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "Project not found." };

  const path = storagePath(project.client_id, f.name);
  const up = await supabase.storage.from("portal-client-files").upload(path, f, { contentType: f.type, upsert: false });
  if (up.error) return { error: "Upload failed." };

  const { error } = await supabase.from("files").insert({
    client_id: project.client_id,
    project_id: project.id,
    name: safeFileName(f.name),
    storage_path: path,
    size_bytes: f.size,
    uploaded_by: user.id,
  });
  if (error) {
    await supabase.storage.from("portal-client-files").remove([path]);
    return { error: "Could not save the file record." };
  }
  revalidatePath("/portal", "layout");
  return { ok: `Uploaded ${safeFileName(f.name)}.` };
}

export async function markPaid(form: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = form.get("invoice_id");
  if (!isUuid(id)) return;
  await supabase.from("invoices").update({ status: "paid" }).eq("id", id).eq("status", "open");
  revalidatePath("/portal", "layout");
}

export async function resetDemo(): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: extra } = await supabase.from("files").select("storage_path").eq("is_seed", false);
  if (extra?.length) await supabase.storage.from("portal-client-files").remove(extra.map((f) => f.storage_path));
  await supabase.rpc("reset_demo");
  revalidatePath("/portal", "layout");
}

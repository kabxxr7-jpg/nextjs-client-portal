import type { SupabaseClient } from "@supabase/supabase-js";

// Plain selects: there is no "where client_id = ..." here on purpose. Row-level security
// in Postgres returns only the rows this user may see.

export interface Project {
  id: string; client_id: string; name: string; status: string; progress: number; due_date: string | null;
  clients: { name: string } | null;
}
export interface Invoice {
  id: string; client_id: string; number: string; amount_cents: number; status: string; due_date: string;
  paid_at: string | null; clients: { name: string } | null; projects: { name: string } | null;
}
export interface FileRow {
  id: string; client_id: string; name: string; size_bytes: number; created_at: string;
  clients: { name: string } | null; projects: { name: string } | null;
}
export interface StatusUpdate {
  id: string; body: string; created_at: string; client_id: string;
  projects: { name: string } | null; clients: { name: string } | null;
}
export interface Activity {
  id: number; action: string; detail: string; created_at: string; clients: { name: string } | null;
}

export async function listProjects(sb: SupabaseClient) {
  const { data } = await sb.from("projects").select("id, client_id, name, status, progress, due_date, clients(name)")
    .order("due_date", { ascending: true }).returns<Project[]>();
  return data ?? [];
}
export async function listInvoices(sb: SupabaseClient) {
  const { data } = await sb.from("invoices")
    .select("id, client_id, number, amount_cents, status, due_date, paid_at, clients(name), projects(name)")
    .order("due_date", { ascending: false }).returns<Invoice[]>();
  return data ?? [];
}
export async function listFiles(sb: SupabaseClient) {
  const { data } = await sb.from("files").select("id, client_id, name, size_bytes, created_at, clients(name), projects(name)")
    .order("created_at", { ascending: false }).returns<FileRow[]>();
  return data ?? [];
}
export async function listUpdates(sb: SupabaseClient, limit = 20) {
  const { data } = await sb.from("status_updates").select("id, body, created_at, client_id, projects(name), clients(name)")
    .order("created_at", { ascending: false }).limit(limit).returns<StatusUpdate[]>();
  return data ?? [];
}
export async function listActivity(sb: SupabaseClient, limit = 50) {
  const { data } = await sb.from("activity").select("id, action, detail, created_at, clients(name)")
    .order("created_at", { ascending: false }).limit(limit).returns<Activity[]>();
  return data ?? [];
}

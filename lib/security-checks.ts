import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped tables in the portal schema
type Db = SupabaseClient<any, any, any, any, any>;
import { CLIENT, INVOICE, SEED_FILE, otherClient } from "@/lib/seed-ids";

export interface CheckResult {
  name: string;
  attempt: string;
  result: string;
  blocked: boolean;
}

/** Runs real queries as the signed-in client, aimed at the OTHER client's data.
 *  Each one should come back empty or be refused by Postgres. Nothing here is mocked. */
export async function runClientChecks(sb: Db, myClientId: string): Promise<CheckResult[]> {
  const otherKey = otherClient(myClientId);
  const other = CLIENT[otherKey];
  const otherInvoice = otherKey === "harbor" ? INVOICE.harborOpen : INVOICE.larkspurOpen;
  const myInvoice = otherKey === "harbor" ? INVOICE.larkspurOpen : INVOICE.harborOpen;
  const out: CheckResult[] = [];

  for (const table of ["projects", "invoices", "files", "status_updates", "activity"] as const) {
    const { data, error } = await sb.from(table).select("id").eq("client_id", other);
    const n = data?.length ?? 0;
    out.push({
      name: `Read another client's ${table.replace("_", " ")}`,
      attempt: `select id from ${table} where client_id = '${other.slice(0, 8)}…'`,
      result: error ? `refused: ${error.message}` : `${n} row${n === 1 ? "" : "s"} returned`,
      blocked: !!error || n === 0,
    });
  }

  {
    const { data, error } = await sb.from("invoices").select("id, number, amount_cents").eq("id", otherInvoice).maybeSingle();
    out.push({
      name: "Fetch another client's invoice by its exact id",
      attempt: `select * from invoices where id = '${otherInvoice.slice(0, 8)}…'`,
      result: error ? `refused: ${error.message}` : data ? `found ${data.number}` : "no row",
      blocked: !!error || !data,
    });
  }

  {
    const { data, error } = await sb.from("invoices").update({ status: "paid" }).eq("id", myInvoice).select("id");
    const n = data?.length ?? 0;
    out.push({
      name: "Mark my own invoice paid (only the agency may)",
      attempt: "update invoices set status = 'paid' where id = <my open invoice>",
      result: error ? `refused: ${error.message}` : `${n} row${n === 1 ? "" : "s"} changed`,
      blocked: !!error || n === 0,
    });
  }

  {
    const { error } = await sb.from("activity").insert({ client_id: myClientId, action: "fake", detail: "forged entry" });
    out.push({
      name: "Write a fake activity log entry",
      attempt: "insert into activity (...) values (...)",
      result: error ? `refused: ${error.message}` : "inserted",
      blocked: !!error,
    });
  }

  {
    const path = SEED_FILE[otherKey];
    const { data, error } = await sb.storage.from("portal-client-files").createSignedUrl(path, 60);
    out.push({
      name: "Get a download link for another client's file",
      attempt: `storage.createSignedUrl('${path.split("/")[1]}')`,
      result: error ? `refused: ${error.message}` : data?.signedUrl ? "link created" : "no link",
      blocked: !!error || !data?.signedUrl,
    });
  }

  {
    const { error } = await sb.rpc("reset_demo");
    out.push({
      name: "Call the admin-only reset function",
      attempt: "rpc('reset_demo')",
      result: error ? `refused: ${error.message}` : "ran",
      blocked: !!error,
    });
  }

  return out;
}

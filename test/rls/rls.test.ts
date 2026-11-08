/**
 * Row-level security suite. Runs against the real Supabase project using ONLY the public anon
 * key, exactly what any visitor's browser holds, and signs in as each demo account.
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and DEMO_PASSWORD
 * (read from .env.local locally, from repository secrets in CI). Skipped when they're absent.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS, type DemoKey } from "@/lib/demo";
import { DB_SCHEMA } from "@/lib/env";
import { CLIENT, INVOICE, PROJECT, SEED_FILE } from "@/lib/seed-ids";
import { runClientChecks } from "@/lib/security-checks";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = process.env.DEMO_PASSWORD;
const configured = !!(URL_ && ANON && PASSWORD);

const TABLES = ["projects", "invoices", "files", "status_updates", "activity"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any, any, any>;

function anon(): Db {
  return createClient(URL_!, ANON!, { db: { schema: DB_SCHEMA }, auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedIn(key: DemoKey): Promise<Db> {
  const sb = anon();
  const email = DEMO_ACCOUNTS.find((a) => a.key === key)!.email;
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error) throw new Error(`sign-in failed for ${key}: ${error.message}`);
  return sb;
}

describe.skipIf(!configured)("row-level security (live database, anon key only)", () => {
  let visitor: Db;
  const clients = {} as Record<"larkspur" | "harbor", Db>;
  let admin: Db;

  beforeAll(async () => {
    visitor = anon();
    clients.larkspur = await signedIn("larkspur");
    clients.harbor = await signedIn("harbor");
    admin = await signedIn("admin");
  });

  afterAll(async () => {
    await Promise.all([clients.larkspur?.auth.signOut(), clients.harbor?.auth.signOut(), admin?.auth.signOut()]);
  });

  describe("signed-out visitor with the anon key", () => {
    it.each([...TABLES, "clients", "profiles"])("reads nothing from %s", async (table) => {
      const { data, error } = await visitor.from(table).select("*");
      // anon has no table grants at all, so Postgres refuses outright
      expect(error?.code === "42501" || (data ?? []).length === 0).toBe(true);
      expect(data ?? []).toHaveLength(0);
    });

    it("cannot create a signed link to any stored file", async () => {
      const { data, error } = await visitor.storage.from("portal-client-files").createSignedUrl(SEED_FILE.larkspur, 60);
      expect(error).toBeTruthy();
      expect(data?.signedUrl).toBeFalsy();
    });

    it("cannot list the private bucket", async () => {
      const { data } = await visitor.storage.from("portal-client-files").list(CLIENT.larkspur);
      expect(data ?? []).toHaveLength(0);
    });
  });

  for (const me of ["larkspur", "harbor"] as const) {
    const other = me === "larkspur" ? "harbor" : "larkspur";

    describe(`client ${me}`, () => {
      it.each(TABLES)(`every %s row returned belongs to ${me}`, async (table) => {
        const { data, error } = await clients[me].from(table).select("client_id");
        expect(error).toBeNull();
        expect((data ?? []).length).toBeGreaterThan(0);
        for (const row of data!) expect(row.client_id).toBe(CLIENT[me]);
      });

      it.each(TABLES)(`asking for ${other}'s %s by client_id returns 0 rows`, async (table) => {
        const { data, error } = await clients[me].from(table).select("id").eq("client_id", CLIENT[other]);
        expect(error).toBeNull();
        expect(data).toHaveLength(0);
      });

      it(`sees only its own client record and its own profile`, async () => {
        const c = await clients[me].from("clients").select("id");
        expect(c.data?.map((r) => r.id)).toEqual([CLIENT[me]]);
        const p = await clients[me].from("profiles").select("client_id, role");
        expect(p.data).toEqual([{ client_id: CLIENT[me], role: "client" }]);
      });

      it(`cannot fetch ${other}'s invoice or project by exact id`, async () => {
        const inv = me === "larkspur" ? INVOICE.harborOpen : INVOICE.larkspurOpen;
        const proj = me === "larkspur" ? PROJECT.harborBooking : PROJECT.larkspurWebsite;
        expect((await clients[me].from("invoices").select("*").eq("id", inv)).data).toHaveLength(0);
        expect((await clients[me].from("projects").select("*").eq("id", proj)).data).toHaveLength(0);
      });

      it(`cannot mark its own invoice paid (0 rows changed, value unchanged)`, async () => {
        const mine = me === "larkspur" ? INVOICE.larkspurOpen : INVOICE.harborOpen;
        const before = await admin.from("invoices").select("status").eq("id", mine).single();
        const { data } = await clients[me].from("invoices").update({ status: "paid" }).eq("id", mine).select();
        expect(data ?? []).toHaveLength(0);
        const after = await admin.from("invoices").select("status").eq("id", mine).single();
        expect(after.data?.status).toBe(before.data?.status);
      });

      it(`cannot promote itself to admin`, async () => {
        const { data: u } = await clients[me].auth.getUser();
        const { data } = await clients[me].from("profiles").update({ role: "admin" }).eq("id", u.user!.id).select();
        expect(data ?? []).toHaveLength(0);
        const check = await admin.from("profiles").select("role").eq("id", u.user!.id).single();
        expect(check.data?.role).toBe("client");
      });

      it(`cannot insert status updates, files or activity rows`, async () => {
        const proj = me === "larkspur" ? PROJECT.larkspurWebsite : PROJECT.harborBooking;
        const s = await clients[me].from("status_updates").insert({ project_id: proj, body: "forged" });
        expect(s.error?.code).toBe("42501");
        const f = await clients[me].from("files").insert({ client_id: CLIENT[me], name: "x", storage_path: `${CLIENT[me]}/forged` });
        expect(f.error?.code).toBe("42501");
        const a = await clients[me].from("activity").insert({ client_id: CLIENT[me], action: "x", detail: "forged" });
        expect(a.error?.code).toBe("42501");
      });

      it(`cannot delete files rows`, async () => {
        const { data } = await clients[me].from("files").delete().eq("client_id", CLIENT[me]).select();
        expect(data ?? []).toHaveLength(0);
        const still = await admin.from("files").select("id").eq("client_id", CLIENT[me]);
        expect((still.data ?? []).length).toBeGreaterThan(0);
      });

      it(`can open its own file but not ${other}'s`, async () => {
        const own = await clients[me].storage.from("portal-client-files").createSignedUrl(SEED_FILE[me], 60);
        expect(own.error).toBeNull();
        expect(own.data?.signedUrl).toMatch(/^https:\/\//);
        const theirs = await clients[me].storage.from("portal-client-files").createSignedUrl(SEED_FILE[other], 60);
        expect(theirs.error).toBeTruthy();
        const dl = await clients[me].storage.from("portal-client-files").download(SEED_FILE[other]);
        expect(dl.data).toBeNull();
      });

      it(`cannot upload to storage, even into its own folder`, async () => {
        const { error } = await clients[me].storage
          .from("portal-client-files")
          .upload(`${CLIENT[me]}/forged-${Date.now()}.txt`, new Blob(["x"], { type: "text/plain" }));
        expect(error).toBeTruthy();
      });

      it(`cannot run the admin-only reset`, async () => {
        const { error } = await clients[me].rpc("reset_demo");
        expect(error?.message).toMatch(/admins only/);
      });

      it(`the in-app security check page reports every attempt blocked`, async () => {
        const results = await runClientChecks(clients[me], CLIENT[me]);
        expect(results.length).toBeGreaterThanOrEqual(10);
        for (const r of results) expect(r, r.name).toMatchObject({ blocked: true });
      });
    });
  }

  describe("admin", () => {
    it.each(TABLES)("reads %s rows of both clients", async (table) => {
      const { data } = await admin.from(table).select("client_id");
      const ids = new Set((data ?? []).map((r) => r.client_id));
      expect(ids.has(CLIENT.larkspur)).toBe(true);
      expect(ids.has(CLIENT.harbor)).toBe(true);
    });

    it("marks an invoice paid; the database stamps paid_at and logs it for that client only", async () => {
      const id = INVOICE.harborOpen;
      const startedAt = new Date(Date.now() - 5000).toISOString();
      await admin.from("invoices").update({ status: "open" }).eq("id", id);
      const { data, error } = await admin.from("invoices").update({ status: "paid" }).eq("id", id).select("status, paid_at, number").single();
      expect(error).toBeNull();
      expect(data?.status).toBe("paid");
      expect(data?.paid_at).toBeTruthy();

      const harborLog = await clients.harbor.from("activity").select("detail").eq("action", "invoice_paid").gte("created_at", startedAt);
      expect(harborLog.data?.some((r) => r.detail.includes(data!.number))).toBe(true);
      const larkspurLog = await clients.larkspur.from("activity").select("detail").eq("action", "invoice_paid").gte("created_at", startedAt);
      expect(larkspurLog.data?.some((r) => r.detail.includes(data!.number))).toBe(false);

      const reopened = await admin.from("invoices").update({ status: "open" }).eq("id", id).select("paid_at").single();
      expect(reopened.data?.paid_at).toBeNull();
    });
  });
});

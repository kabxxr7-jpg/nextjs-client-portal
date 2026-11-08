// Uploads the two seed files by signing in as the demo admin (anon key + RLS, no service key).
// Usage: node scripts/seed-files.mjs (run once, on an empty bucket)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { db: { schema: "portal" }, auth: { persistSession: false } });
const { error: signInError } = await sb.auth.signInWithPassword({ email: "admin@fernhill-studio.test", password: env.DEMO_PASSWORD });
if (signInError) throw signInError;

// A minimal valid one-page PDF with a line of text.
function pdf(text) {
  const stream = `BT /F1 18 Tf 72 720 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([out], { type: "application/pdf" });
}

const files = [
  { client: "11111111-1111-4111-8111-111111111111", project: "a1000000-0000-4000-8000-000000000003",
    name: "seed-brand-photos-contact-sheet.pdf", text: "Larkspur Bakery - brand photo contact sheet (demo file)" },
  { client: "11111111-1111-4111-8111-111111111111", project: "a1000000-0000-4000-8000-000000000001",
    name: "seed-homepage-wireframe.pdf", text: "Larkspur Bakery - homepage wireframe v2 (demo file)" },
  { client: "22222222-2222-4222-8222-222222222222", project: "b2000000-0000-4000-8000-000000000001",
    name: "seed-booking-app-test-plan.pdf", text: "Harbor Lane Yoga - booking app test plan (demo file)" },
];

for (const f of files) {
  const path = `${f.client}/${f.name}`;
  const blob = pdf(f.text);
  const up = await sb.storage.from("portal-client-files").upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (up.error) throw up.error;
  const row = await sb.from("files").insert(
    { client_id: f.client, project_id: f.project, name: f.name.replace(/^seed-/, ""), storage_path: path, size_bytes: blob.size, is_seed: true },
  );
  if (row.error) throw row.error;
  console.log("seeded", path);
}
await sb.auth.signOut();

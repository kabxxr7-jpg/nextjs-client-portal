# nextjs-portal: proposed ledger lines

Written by the nextjs-portal side session on 2026-11-09 for the frontdesk session to merge into `~/upwork-proposals/claims-ledger.md` and `proof-links.md`. Not merged by this session. The repo link is valid only after the user's go to publish.

## claims-ledger.md, section B (new row)

| Item | Evidence | Allowed wording | Forbidden wording |
|---|---|---|---|
| nextjs-portal (Fernhill Studio client portal demo) | Added 2026-11-09 IST. Live at https://fernhill-client-portal.vercel.app (Vercel, functions in sin1; Supabase free plan, own `portal` schema inside the shared "kabiir" project). Next.js 16 App Router + TypeScript, Supabase Auth (cookie sessions via @supabase/ssr), Postgres RLS on all 7 tables, private Storage bucket with storage RLS, trigger-written activity log. 98/98 tests on 2026-11-09: 39 unit + 59 RLS tests run against the live database with only the public anon key (each of 2 clients can't read, fetch by id, update, insert, delete or sign file links for the other's data; signed-out visitor gets nothing; admin reads both). In-app "Security check" page shows 10/10 cross-client attempts blocked live. Live browser run: admin update/upload/mark-paid reached only the right client. Supabase security advisor: 0 findings in the portal schemas (4 found after exposing the schema, fixed in migration 0002). Demo sign-in 1.9-2.1 s warm. | a working Next.js + Supabase client portal: email/password sign-in with client and admin roles, data isolation enforced by Postgres row-level security (not just the UI) and proven by an automated test suite against the live database, private file storage with per-client folders and short-lived signed links, admin uploads/status updates/mark-paid, a database-written activity log, light/dark mode, works on a phone; "Supabase security advisor clean for the portal schemas"; "moved server functions next to the database and cut demo sign-in from ~5-6 s to ~2 s" | client or production use; real payments (mark-paid only records it); magic links or email sending (off in the demo); "secure"/"bank-grade"/"HIPAA"/compliance claims; multi-tenant SaaS at scale or any load figure; Lighthouse scores (not measured); CI green (not run until the repo is public); "uptime" |

## proof-links.md (new row)

| Topic | Link | Notes |
|---|---|---|
| Next.js + Supabase portals / dashboards with auth and RLS (client portal, member area, SaaS MVP jobs) | https://fernhill-client-portal.vercel.app | Label: "self-initiated demo, fictional agency and clients; one-click demo logins". Best pages: sign in as Maya, then Security check (10/10 blocked); then Priya (admin). Hosted on Vercel, not the Mac, so it is up when the Mac is off. Supabase free projects pause after a week without traffic: open it before pasting. Code (after publish): https://github.com/kabxxr7-jpg/nextjs-client-portal |

## Honest notes for proposals

- The portal shares the "kabiir" Supabase project (free-plan limit of 2 projects), in its own `portal` + `portal_private` schemas; `supabase/rollback.sql` removes it. The project's exposed schemas now include `portal` (changed 2026-11-09).
- Anyone can sign in as the demo admin; the admin page has a reset button.
- Sign-ins are not written to the activity log (removed to keep the advisor clean).

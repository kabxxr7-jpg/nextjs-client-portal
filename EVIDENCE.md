# Evidence: Northwick client portal (build: nextjs-portal)

Measured facts only. Everything below was run or observed on 2026-11-09 (IST early morning; UTC 2026-11-08 late evening).

## Live

- URL: https://fernhill-client-portal.vercel.app (Vercel project `fernhill-client-portal`, production). Functions run in `sin1`; response header seen: `x-vercel-id: bom1::sin1::…`.
- `curl` from this Mac (India): `/` 200 in 0.37 s, `/login` 200 in 0.23 s, `/portal` signed out → 307 to `/login` in 0.16 s.
- Headers present on `/`: `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`, `strict-transport-security` (from Vercel).
- Stack versions installed: Next.js 16.4.5, @supabase/supabase-js 2.119.0, @supabase/ssr 0.12.7.

## Tests

- Unit: 39 passed (vitest, no network).
- RLS suite against the live database, public anon key only (no service key anywhere): 59 passed.
- Full run: 4 files, 98/98 passed. Output: `evidence/test-run-2026-11-09.txt`.
- The RLS suite passed on its first run against the live database (55/55, before 4 tests were added for the advisor fixes).
- CI (GitHub Actions, `.github/workflows/ci.yml`): green on the first two runs, 2026-11-09. Run 42536906333 (with repository secrets): typecheck, 39 unit passed, 59 RLS passed against the live database, `next build` compiled. Run 42536879694 (pushed before the secrets were added): green with the RLS step skipped by design.
- Repo public since 2026-11-09: https://github.com/kabxxr7-jpg/nextjs-client-portal (gitleaks clean on the full history before the push).

## Live browser run (headless Chromium, 2x, light mode)

Script `scripts/e2e-live.mjs`, log `evidence/e2e-live-2026-11-09.json`. Third run after the region change; all checks passed:

| Check | Result |
|---|---|
| Demo sign-in, click to portal loaded (Maya / Priya) | 2.1 s / 1.9 s (earlier run with functions in the default US region: 6.3 s / 5.0 s; first run after moving to `sin1`: 3.7 s / 2.3 s) |
| Security check page as Maya | "10 / 10 blocked" |
| Maya opens her own file | 303 to a signed `/storage/v1/object/sign/portal-client-files/…` link, then 200 `application/pdf` |
| Admin posts a status update to Larkspur, uploads a PDF to Harbor Lane, marks NB-1003 paid | all succeeded in the UI |
| Maya's activity log | shows "Invoice NB-1003 marked paid" and the status update; does not show Harbor's upload |
| Sam (Harbor Lane) | sees the uploaded file; his activity log has no NB-1003 |
| Phone width 390 px | no horizontal scroll |
| Dark mode (prefers-color-scheme: dark) | body background rgb(20, 21, 19) |
| Admin "Reset demo data" | NB-1003 back to open |

Also checked by hand in the browser pane: the try-it page, one-click sign-in as Maya, the security check page (10/10 blocked).

## Database (shared Supabase project "kabiir", free plan)

A new free project was refused (2-project limit per owner, quote was $0). With the user's go, the portal went into the existing `kabiir` project in its own schemas.

What was added (all in the repo as migrations):
- `supabase/migrations/0001_portal.sql`: schema `portal` (7 tables, RLS on all, policies, triggers); private storage bucket `portal-client-files`; 3 storage policies named `portal: …` on `storage.objects`.
- `supabase/migrations/0002_advisor_fixes.sql`: schema `portal_private` (the 2 RLS helper functions, moved out of the exposed API); `reset_demo` switched to SECURITY INVOKER; `log_sign_in` dropped.
- Seed: 2 clients, 5 projects, 5 invoices, 4 status updates, 3 PDF files; 3 demo users in `auth.users` (bcrypt hash only; the password is in `.env.local` and Vercel env, never in the repo).
- **Project setting changed on 2026-11-09:** Data API exposed schemas went from `public, graphql_public` to `public, graphql_public, portal` (changed in the dashboard). `ragdemo` is not exposed.
- Undo: `supabase/rollback.sql` (drops `portal`, `portal_private`, the 3 storage policies, the bucket, the 3 demo users; then remove `portal` from exposed schemas).

Not touched: anything in `public`. The 2026-11-01 migration `enable_rls_and_revoke_anon_authenticated` is unchanged.

Tracker smoke check (same query, same roles, before and after):

| Check | Before | After |
|---|---|---|
| Anon REST `GET /rest/v1/Company` | 42501 permission denied | 42501 permission denied |
| As `postgres`: Company / Application / Profile / _prisma_migrations rows | 10 / 10 / 1 / 1 | 10 / 10 / 1 / 1 |
| `public` policies / RLS on all tables / grants to anon+authenticated | – | 0 / true / 0 |

Security advisor:

| When | Findings |
|---|---|
| Before any change | 13 INFO (RLS on, no policies: 8 `public`, 5 `ragdemo`) + 8 WARN (anon can run `public.ragdemo_*` SECURITY DEFINER functions). All pre-existing, left alone |
| After 0001 + exposing `portal` | same + 4 WARN in `portal` (signed-in users could call SECURITY DEFINER `is_admin`, `my_client_id`, `log_sign_in`, `reset_demo` over `/rest/v1/rpc`) + 1 WARN project-wide "leaked password protection disabled" |
| After 0002 | `portal` findings: 0. Remaining: the pre-existing 13 INFO + 8 WARN, and the project-wide Auth WARN (leaked password protection is a setting of the whole project, not of this build; not changed) |

## Not measured / not done

- No Lighthouse or load test.
- No real email sending: magic links are off (the demo emails use `.test`).
- Activity no longer logs sign-ins (removed with the advisor fix).

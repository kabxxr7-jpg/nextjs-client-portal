# Fernhill Studio client portal (Next.js + Supabase demo)

**Live demo:** LIVE_URL (one-click demo logins on the home page)

A client portal for a fictional design agency. Each client signs in and sees only their own projects, invoices, files and status updates. The agency admin sees everything and can upload files, post updates and mark invoices paid. Every change lands in an activity log.

The rule "a client sees only their own rows" is enforced **inside Postgres with row-level security**, not by hiding things in the UI. The app only ever holds Supabase's public anon key, so every query runs as the signed-in user, and the same rules apply to anyone calling the Supabase API directly. A test suite proves it against the live database.

## Try it

1. Open the live demo and click **Sign in as Maya** (client, Larkspur Bakery): 3 projects, 3 invoices, 2 files.
2. Open **Security check**: the page runs real queries for the other client's data with Maya's session and shows each one blocked.
3. Sign out and click **Sign in as Priya** (admin): post a status update, upload a file, or mark invoice NB-1003 paid.
4. Sign back in as Maya: the update, the file and the payment are there, and the activity log shows each one.

## Features

- Email + password sign-in (Supabase Auth, cookie sessions through `@supabase/ssr`), one-click demo accounts: 2 clients, 1 admin
- Clients: overview, projects with progress and status updates, invoices (open / overdue / paid), files, activity log
- Admin: every client's data, post a status update, upload a file into a client's private folder, mark an invoice paid, reset the demo
- Files in a **private** Supabase Storage bucket; downloads go through 60-second signed links created with the user's own session
- Activity log written by **database triggers** (invoice paid, file uploaded, status posted, sign-in), so the app can't skip or forge entries
- Light and dark mode (follows the system, with a toggle), works on a phone (tables stack into cards)

## How access is enforced

| Layer | Rule |
|---|---|
| Table grants | `anon` has no rights on any portal table. Signed-out requests are refused outright |
| RLS: read | Every table: `is_admin() or client_id = my_client_id()`. `clients` and `profiles` show only your own row |
| RLS: write | Insert/update/delete only for admins. No policy at all lets anyone write `activity` (triggers do) or change `profiles` (no self-promotion to admin) |
| Helpers | `is_admin()` and `my_client_id()` are `security definer` functions with a fixed `search_path`, so policies don't recurse into `profiles` |
| Integrity | A trigger copies `client_id` onto status updates from their project; `paid_at` is set by the database, never by the client |
| Storage | Bucket `client-files` is private. Files live under `<client_id>/…`; clients can read only their own folder, only admins upload or delete |
| App | No service-role key anywhere. No query adds `where client_id = mine`. Filtering is left to RLS on purpose. Server actions check the role only to give a friendly error |

Schema and policies: [`supabase/migrations/0001_portal.sql`](supabase/migrations/0001_portal.sql).

## Tests

```bash
npm test          # unit tests (no network)
npm run test:rls  # RLS suite against the live database with the anon key
```

- **Unit (UNIT_COUNT):** money/date formatting, invoice states, upload checks (type, 4 MB limit), file-name cleaning (path traversal), storage paths can't be steered into another client's folder, open-redirect guard, demo accounts
- **RLS (RLS_COUNT, live database, anon key only):** a signed-out visitor reads nothing and can't sign a file link; for **each** client: every row returned is theirs, asking for the other client's rows by `client_id` or exact id returns nothing, can't mark an invoice paid, can't promote itself to admin, can't insert updates/files/activity, can't delete files, can open its own file but not the other client's, can't upload, can't run the admin reset, and the in-app security check reports all attempts blocked; the admin reads both clients and marking an invoice paid stamps `paid_at` and logs it for that client only

CI (GitHub Actions) runs typecheck, unit tests, the RLS suite (when the repository secrets are set) and a production build.

## Real vs simulated

| Part | Real | Simulated / demo |
|---|---|---|
| Sign-in | Real Supabase Auth accounts, real sessions in HTTP-only cookies | Demo accounts share one password held by the server for one-click login. Magic links are off: the demo emails use the `.test` domain, which can't receive mail |
| Data isolation | Real Postgres row-level security, tested against the live database | – |
| Files | Real private Supabase Storage with storage RLS and signed links | Seed files are small generated PDFs |
| Invoices | Real records, status and timestamps in Postgres | "Mark paid" records a payment; no card is charged and no payment provider is connected |
| Clients and agency | – | Fernhill Studio, Larkspur Bakery and Harbor Lane Yoga are fictional |
| Hosting | Real Vercel deployment, Supabase free tier | Anyone can use the demo admin; an admin reset puts the data back |

## Run it yourself

1. Create a Supabase project. Run `supabase/migrations/0001_portal.sql`, then `supabase/seed.sql`, in the SQL editor.
2. `cp .env.example .env.local` and fill in the project URL, the anon (publishable) key and a long `DEMO_PASSWORD`.
3. `node scripts/seed-users.mjs` prints SQL for the three demo users (bcrypt hash only). Run it in the SQL editor.
4. `npm install`, `node scripts/seed-files.mjs`, then `npm run dev`.

## Stack

Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts` session refresh), TypeScript, Supabase (Auth, Postgres RLS, Storage) via `@supabase/ssr`, plain CSS with light/dark tokens, Vitest, GitHub Actions, Vercel.

## License

MIT

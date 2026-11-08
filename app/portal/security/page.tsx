import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { runClientChecks } from "@/lib/security-checks";

export const metadata = { title: "Security check" };

export default async function SecurityPage() {
  const { supabase, profile, isAdmin } = await requireViewer();

  if (isAdmin || !profile.client_id) {
    const tables = ["projects", "invoices", "files", "status_updates", "activity"] as const;
    const counts = await Promise.all(
      tables.map(async (t) => [t, (await supabase.from(t).select("id", { count: "exact", head: true })).count ?? 0] as const),
    );
    return (
      <>
        <div className="page-head"><h1>Security check</h1></div>
        <div className="card">
          <p>As the admin you can read every client&rsquo;s rows:</p>
          <ul className="list">{counts.map(([t, n]) => <li key={t} className="row"><span className="mono">{t}</span><strong>{n}</strong></li>)}</ul>
          <p className="small muted" style={{ marginTop: 12 }}>
            Sign in as a client from the <Link href="/">try-it page</Link> to watch the database refuse that client access to the other client&rsquo;s data.
          </p>
        </div>
      </>
    );
  }

  const results = await runClientChecks(supabase, profile.client_id);
  const passed = results.filter((r) => r.blocked).length;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Security check</h1>
          <p className="muted" style={{ margin: 0 }}>
            These queries just ran against the live database with your session ({profile.full_name}, {profile.clients?.name}).
            Each one tries to reach the other client&rsquo;s data or do an admin-only action.
          </p>
        </div>
        <span className={passed === results.length ? "pass" : "fail"}>{passed} / {results.length} blocked</span>
      </div>
      <div className="card table-wrap">
        <table className="stack">
          <thead><tr><th>Attempt</th><th>Query</th><th>Database said</th><th>Blocked?</th></tr></thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.name}>
                <td data-label="Attempt">{r.name}</td>
                <td data-label="Query" className="mono">{r.attempt}</td>
                <td data-label="Database said">{r.result}</td>
                <td data-label="Blocked?" className={r.blocked ? "pass" : "fail"}>{r.blocked ? "✓ yes" : "✗ NO"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        The app never adds a &ldquo;where client_id = mine&rdquo; filter. Postgres row-level security does the filtering, so the
        same rules hold for anyone calling the Supabase API directly with the public key.
      </p>
    </>
  );
}

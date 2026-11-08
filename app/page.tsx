import Link from "next/link";
import { demoSignIn } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { getViewer } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  "demo-sign-in-failed": "The demo sign-in didn't work just now. Please try again.",
  "unknown-account": "Unknown demo account.",
};

export default async function TryItPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const viewer = await getViewer();
  return (
    <main>
      <div className="wrap">
        <section className="hero">
          <h1>A client portal where each client sees only their own work.</h1>
          <p>
            Projects, invoices, files and status updates for a fictional design agency. Pick an account below to
            sign in with one click. The rule &ldquo;clients see only their own rows&rdquo; is enforced inside the
            database with row-level security, not just hidden in the page.
          </p>
          {viewer && (
            <p>
              You&rsquo;re signed in as <strong>{viewer.profile.full_name}</strong>. <Link href="/portal">Open the portal →</Link>
            </p>
          )}
        </section>

        {error && ERRORS[error] && <p className="notice error" role="alert">{ERRORS[error]}</p>}

        <h2 style={{ margin: "16px 0 12px" }}>Try it: one-click demo logins</h2>
        <div className="grid grid-3">
          {DEMO_ACCOUNTS.map((a) => (
            <div className="card demo-card" key={a.key}>
              <div className="row">
                <h3 style={{ margin: 0 }}>{a.name}</h3>
                <span className={`badge ${a.role === "admin" ? "admin" : ""}`}>{a.role}</span>
              </div>
              <div className="role">{a.company}</div>
              <p className="small" style={{ margin: 0 }}>{a.blurb}</p>
              <form action={demoSignIn}>
                <input type="hidden" name="account" value={a.key} />
                <SubmitButton className="btn block" pending="Signing in…">Sign in as {a.name.split(" ")[0]}</SubmitButton>
              </form>
            </div>
          ))}
        </div>

        <div className="grid grid-2" style={{ marginTop: 24 }}>
          <div className="card">
            <h2>Things to try (3 minutes)</h2>
            <ol className="small" style={{ paddingLeft: 18, margin: 0 }}>
              <li>Sign in as <strong>Maya</strong> (Larkspur Bakery). You see 3 projects and 3 invoices.</li>
              <li>Open <strong>Security check</strong>: the page asks the database for Harbor Lane&rsquo;s rows using Maya&rsquo;s session and gets nothing back.</li>
              <li>Sign out, sign in as <strong>Priya</strong> (admin). Post a status update or upload a file to Larkspur, or mark invoice NB-1003 paid.</li>
              <li>Sign back in as Maya: the update, file and payment show up, and the activity log records each one.</li>
            </ol>
          </div>
          <div className="card">
            <h2>How access is enforced</h2>
            <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
              <li>The browser and server only ever use Supabase&rsquo;s public anon key, so every query runs as the signed-in user.</li>
              <li>Postgres policies on every table: a client reads rows where <span className="mono">client_id</span> is their own; only admins write.</li>
              <li>Files sit in a private storage bucket; a client can only open files under their own folder. Downloads use 60-second signed links.</li>
              <li>The activity log is written by database triggers, so it can&rsquo;t be skipped or edited from the app.</li>
            </ul>
          </div>
        </div>

        <p className="small muted" style={{ marginTop: 24 }}>
          Prefer typing? <Link href="/login">Sign in with email and password</Link>.
        </p>
      </div>
    </main>
  );
}

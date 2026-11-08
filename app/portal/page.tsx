import Link from "next/link";
import { Empty, InvoiceBadge, ProjectBadge, When } from "@/components/bits";
import { requireViewer } from "@/lib/auth";
import { listActivity, listInvoices, listProjects, listUpdates } from "@/lib/data";
import { money, sumOpen } from "@/lib/format";

export default async function Overview() {
  const { supabase, profile, isAdmin } = await requireViewer();
  const [projects, invoices, updates, activity] = await Promise.all([
    listProjects(supabase), listInvoices(supabase), listUpdates(supabase, 4), listActivity(supabase, 5),
  ]);
  const active = projects.filter((p) => p.status !== "done").length;
  const open = invoices.filter((i) => i.status !== "paid");
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi {profile.full_name.split(" ")[0]}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {isAdmin ? "Everything across all clients." : `Here's where ${profile.clients?.name} stands.`}
          </p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card"><div className="stat-label">Active projects</div><div className="stat-value">{active}</div></div>
        <div className="card"><div className="stat-label">Open invoices</div><div className="stat-value">{open.length}</div></div>
        <div className="card"><div className="stat-label">Amount due</div><div className="stat-value">{money(sumOpen(invoices))}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="row"><h2>Latest updates</h2><Link className="small" href="/portal/projects">All projects</Link></div>
          {updates.length === 0 ? <Empty>No updates yet.</Empty> : (
            <ul className="list">
              {updates.map((u) => (
                <li key={u.id}>
                  <div className="small muted">
                    {isAdmin && <>{u.clients?.name} · </>}{u.projects?.name} · <When iso={u.created_at} />
                  </div>
                  <div>{u.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid">
          <div className="card">
            <div className="row"><h2>Projects</h2></div>
            <ul className="list">
              {projects.slice(0, 4).map((p) => (
                <li key={p.id} className="row">
                  <span>{isAdmin && <span className="muted">{p.clients?.name} · </span>}{p.name}</span>
                  <ProjectBadge status={p.status} />
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="row"><h2>Open invoices</h2><Link className="small" href="/portal/invoices">All invoices</Link></div>
            {open.length === 0 ? <Empty>Nothing due. Thank you!</Empty> : (
              <ul className="list">
                {open.map((i) => (
                  <li key={i.id} className="row">
                    <span>{i.number}{isAdmin && <span className="muted"> · {i.clients?.name}</span>}</span>
                    <span>{money(i.amount_cents)} <InvoiceBadge inv={i} /></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <div className="row"><h2>Recent activity</h2><Link className="small" href="/portal/activity">Full log</Link></div>
            <ul className="list small">
              {activity.map((a) => (
                <li key={a.id} className="row"><span>{a.detail}</span><span className="muted"><When iso={a.created_at} /></span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

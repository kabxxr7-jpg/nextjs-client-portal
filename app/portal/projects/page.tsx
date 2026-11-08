import { Empty, ProjectBadge, When } from "@/components/bits";
import { requireViewer } from "@/lib/auth";
import { listProjects, listUpdates } from "@/lib/data";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Projects" };

export default async function Projects() {
  const { supabase, isAdmin } = await requireViewer();
  const [projects, updates] = await Promise.all([listProjects(supabase), listUpdates(supabase, 100)]);
  return (
    <>
      <div className="page-head"><h1>Projects</h1><span className="muted small">{projects.length} total</span></div>
      <div className="grid grid-2">
        {projects.map((p) => {
          const mine = updates.filter((u) => u.projects?.name === p.name && u.client_id === p.client_id);
          return (
            <article className="card" key={p.id}>
              <div className="row">
                <h2 style={{ margin: 0 }}>{p.name}</h2>
                <ProjectBadge status={p.status} />
              </div>
              {isAdmin && <div className="small muted">{p.clients?.name}</div>}
              <div className="progress" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} progress`}>
                <span style={{ width: `${p.progress}%` }} />
              </div>
              <div className="row small muted"><span>{p.progress}% done</span><span>Due {shortDate(p.due_date)}</span></div>
              <h3 style={{ marginTop: 14 }}>Status updates</h3>
              {mine.length === 0 ? <Empty>No updates yet.</Empty> : (
                <ul className="list small">
                  {mine.map((u) => (
                    <li key={u.id}><div className="muted"><When iso={u.created_at} /></div>{u.body}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

import { resetDemo } from "@/app/portal/actions";
import { StatusForm, UploadForm } from "@/components/forms";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import { listProjects } from "@/lib/data";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const projects = (await listProjects(supabase)).map((p) => ({ id: p.id, name: p.name, client: p.clients?.name ?? "" }));
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Admin</h1>
          <p className="muted" style={{ margin: 0 }}>Post updates and share files with a client. Mark invoices paid on the Invoices page.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Post a status update</h2><StatusForm projects={projects} /></div>
        <div className="card"><h2>Upload a file for a client</h2><UploadForm projects={projects} /></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Reset the demo</h2>
        <p className="small muted">Removes visitor-added updates and files and re-opens invoices NB-1003 and HY-2002.</p>
        <form action={resetDemo}><SubmitButton className="btn ghost" pending="Resetting…">Reset demo data</SubmitButton></form>
      </div>
    </>
  );
}

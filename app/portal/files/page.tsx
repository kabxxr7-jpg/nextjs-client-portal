import { Empty, When } from "@/components/bits";
import { requireViewer } from "@/lib/auth";
import { listFiles } from "@/lib/data";
import { fileSize } from "@/lib/format";

export const metadata = { title: "Files" };

export default async function Files() {
  const { supabase, isAdmin } = await requireViewer();
  const files = await listFiles(supabase);
  return (
    <>
      <div className="page-head"><h1>Files</h1><span className="muted small">Private storage · links expire after 60 seconds</span></div>
      <div className="card table-wrap">
        {files.length === 0 ? <Empty>No files yet.</Empty> : (
          <table className="stack">
            <thead><tr><th>Name</th>{isAdmin && <th>Client</th>}<th>Project</th><th>Added</th><th className="num">Size</th><th></th></tr></thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td data-label="Name" className="mono" style={{ wordBreak: "break-word" }}>{f.name}</td>
                  {isAdmin && <td data-label="Client">{f.clients?.name}</td>}
                  <td data-label="Project">{f.projects?.name ?? "–"}</td>
                  <td data-label="Added"><When iso={f.created_at} /></td>
                  <td data-label="Size" className="num">{fileSize(f.size_bytes)}</td>
                  <td data-label=""><a className="btn ghost small" href={`/portal/files/${f.id}`} target="_blank" rel="noopener">Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

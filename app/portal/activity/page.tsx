import { Empty, When } from "@/components/bits";
import { requireViewer } from "@/lib/auth";
import { listActivity } from "@/lib/data";

export const metadata = { title: "Activity" };

const ICON: Record<string, string> = {
  invoice_paid: "💳", file_uploaded: "📎", status_posted: "📝", signed_in: "🔑",
};

export default async function ActivityPage() {
  const { supabase, isAdmin } = await requireViewer();
  const items = await listActivity(supabase, 100);
  return (
    <>
      <div className="page-head">
        <h1>Activity log</h1>
        <span className="muted small">Written by database triggers · newest first</span>
      </div>
      <div className="card">
        {items.length === 0 ? <Empty>Nothing yet.</Empty> : (
          <ul className="list">
            {items.map((a) => (
              <li key={a.id} className="row">
                <span><span aria-hidden>{ICON[a.action] ?? "•"}</span> {a.detail}
                  {isAdmin && a.clients && <span className="muted small"> · {a.clients.name}</span>}</span>
                <span className="muted small"><When iso={a.created_at} /></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

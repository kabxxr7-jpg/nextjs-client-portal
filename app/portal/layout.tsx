import { signOut } from "@/app/actions";
import { Nav } from "@/components/Nav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requireViewer();
  return (
    <>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="wrap row" style={{ paddingTop: 10 }}>
          <div className="who" style={{ textAlign: "left" }}>
            <strong>{profile.full_name}</strong>
            {isAdmin ? "Admin · Fernhill Studio" : `Client · ${profile.clients?.name ?? ""}`}
          </div>
          <form action={signOut}>
            <SubmitButton className="btn ghost small" pending="Signing out…">Sign out</SubmitButton>
          </form>
        </div>
        <div className="wrap">
          <Nav isAdmin={isAdmin} />
        </div>
      </div>
      <main>
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}

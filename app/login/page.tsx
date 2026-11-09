import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main>
      <div className="wrap" style={{ maxWidth: 440 }}>
        <div className="card">
          <h1>Sign in</h1>
          <p className="muted small">Northwick Studio client portal.</p>
          <LoginForm next={next} />
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>
          Just looking? <Link href="/">Use a one-click demo account</Link>.
        </p>
      </div>
    </main>
  );
}

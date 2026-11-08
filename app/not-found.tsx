import Link from "next/link";

export default function NotFound() {
  return (
    <main><div className="wrap"><div className="card"><h1>Not found</h1><p>That page doesn&rsquo;t exist, or it isn&rsquo;t yours to see.</p><Link href="/portal">Back to the portal</Link></div></div></main>
  );
}

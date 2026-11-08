import { invoiceState, projectStatusLabel, relativeTime } from "@/lib/format";

export function ProjectBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{projectStatusLabel(status)}</span>;
}

export function InvoiceBadge({ inv }: { inv: { status: string; due_date: string } }) {
  const s = invoiceState(inv);
  return <span className={`badge ${s}`}>{s === "paid" ? "Paid" : s === "overdue" ? "Overdue" : "Open"}</span>;
}

export function When({ iso }: { iso: string }) {
  return <time dateTime={iso} title={new Date(iso).toUTCString()}>{relativeTime(iso)}</time>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="muted small" style={{ margin: 0 }}>{children}</p>;
}

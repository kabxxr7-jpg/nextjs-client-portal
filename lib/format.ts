export function money(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const s = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return shortDate(iso);
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PROJECT_STATUS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "Ready for review",
  done: "Done",
};

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUS[status] ?? status;
}

export type InvoiceState = "paid" | "open" | "overdue";

export function invoiceState(
  inv: { status: string; due_date: string },
  today: Date = new Date(),
): InvoiceState {
  if (inv.status === "paid") return "paid";
  const todayIso = today.toISOString().slice(0, 10);
  return inv.due_date < todayIso ? "overdue" : "open";
}

export function sumOpen(invoices: { status: string; amount_cents: number }[]): number {
  return invoices.filter((i) => i.status !== "paid").reduce((t, i) => t + i.amount_cents, 0);
}

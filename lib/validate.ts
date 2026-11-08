export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB bodies
export const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "text/plain", "text/csv"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

export function checkUpload(file: { name: string; size: number; type: string } | null): Check<true> {
  if (!file || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Files must be 4 MB or smaller." };
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type))
    return { ok: false, error: "Allowed types: PDF, PNG, JPEG, TXT, CSV." };
  return { ok: true, value: true };
}

/** Keeps letters, digits, dot, dash, underscore; collapses the rest to "-". Never empty. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return cleaned || "file";
}

/** Storage key: "<client_id>/<random>-<name>". The first folder is what the storage RLS policy checks. */
export function storagePath(clientId: string, name: string, rand: string = crypto.randomUUID()): string {
  if (!isUuid(clientId)) throw new Error("client id must be a uuid");
  return `${clientId}/${rand.slice(0, 8)}-${safeFileName(name)}`;
}

export function checkStatusBody(raw: unknown): Check<string> {
  const body = typeof raw === "string" ? raw.trim() : "";
  if (!body) return { ok: false, error: "Write an update first." };
  if (body.length > 1000) return { ok: false, error: "Keep updates under 1000 characters." };
  return { ok: true, value: body };
}

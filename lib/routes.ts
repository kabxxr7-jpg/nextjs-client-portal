export function isProtectedPath(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

/** Only allow same-site relative redirects after sign-in (stops open redirects). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/portal";
  return isProtectedPath(next.split("?")[0]) ? next : "/portal";
}

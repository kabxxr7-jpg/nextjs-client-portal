"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const links = [
    ["/portal", "Overview"],
    ["/portal/projects", "Projects"],
    ["/portal/invoices", "Invoices"],
    ["/portal/files", "Files"],
    ["/portal/activity", "Activity"],
    ["/portal/security", "Security check"],
    ...(isAdmin ? [["/portal/admin", "Admin"]] : []),
  ];
  return (
    <nav className="nav" aria-label="Portal">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Northwick Studio client portal (demo)", template: "%s · Northwick portal (demo)" },
  description:
    "Demo client portal built with Next.js and Supabase: sign-in, row-level security, file storage and an activity log. Fictional agency and clients.",
  robots: { index: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141513" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="demo-bar">Demo: Northwick Studio and its clients are fictional. Data resets from the admin page.</div>
        <header className="topbar">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden>N</span>
              <span>Northwick Studio <span className="muted" style={{ fontWeight: 400 }}>portal</span></span>
            </Link>
            <span className="spacer" />
            <ThemeToggle />
          </div>
        </header>
        {children}
        <footer>
          <div className="wrap">
            Next.js App Router · Supabase Auth, Postgres row-level security and Storage · deployed on Vercel.
          </div>
        </footer>
      </body>
    </html>
  );
}

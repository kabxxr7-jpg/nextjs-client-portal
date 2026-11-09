export type DemoKey = "larkspur" | "harbor" | "admin";

export interface DemoAccount {
  key: DemoKey;
  email: string;
  name: string;
  role: "client" | "admin";
  company: string;
  blurb: string;
}

// Fictional people and businesses. The .test domain cannot receive mail.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    key: "larkspur",
    email: "maya@larkspur-bakery.test",
    name: "Maya Ortiz",
    role: "client",
    company: "Larkspur Bakery",
    blurb: "Client. Sees only Larkspur's 3 projects, invoices and files.",
  },
  {
    key: "harbor",
    email: "sam@harborlane-yoga.test",
    name: "Sam Okafor",
    role: "client",
    company: "Harbor Lane Yoga",
    blurb: "Client. Sees only Harbor Lane's 2 projects, invoices and files.",
  },
  {
    key: "admin",
    email: "admin@fernhill-studio.test",
    name: "Priya Shah",
    role: "admin",
    company: "Northwick Studio (the agency)",
    blurb: "Admin. Sees every client; uploads files, posts updates, marks invoices paid.",
  },
] as const;

export function demoAccount(key: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.key === key);
}

function need(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const supabaseUrl = () => need("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () =>
  need("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const demoPassword = () => need("DEMO_PASSWORD", process.env.DEMO_PASSWORD);

/** Postgres schema holding the portal tables (kept out of `public` so it can share a project). */
export const DB_SCHEMA = "portal";

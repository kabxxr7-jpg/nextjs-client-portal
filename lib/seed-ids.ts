// Fixed ids from supabase/seed.sql, used by the security check page and the RLS tests.
export const CLIENT = {
  larkspur: "11111111-1111-4111-8111-111111111111",
  harbor: "22222222-2222-4222-8222-222222222222",
} as const;

export const PROJECT = {
  larkspurWebsite: "a1000000-0000-4000-8000-000000000001",
  harborBooking: "b2000000-0000-4000-8000-000000000001",
} as const;

export const INVOICE = {
  larkspurOpen: "c1000000-0000-4000-8000-000000000003",
  harborOpen: "d2000000-0000-4000-8000-000000000002",
} as const;

export const SEED_FILE = {
  larkspur: `${CLIENT.larkspur}/seed-brand-photos-contact-sheet.pdf`,
  harbor: `${CLIENT.harbor}/seed-booking-app-test-plan.pdf`,
} as const;

export function otherClient(clientId: string): keyof typeof CLIENT {
  return clientId === CLIENT.larkspur ? "harbor" : "larkspur";
}

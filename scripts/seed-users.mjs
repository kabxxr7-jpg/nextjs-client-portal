// Prints SQL that creates the three demo users (auth.users + auth.identities) and their profiles.
// The password comes from DEMO_PASSWORD in .env.local and only its bcrypt hash is printed.
// Usage: node scripts/seed-users.mjs > /tmp/somewhere/users.sql, then run it in the SQL editor.
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]),
);
if (!env.DEMO_PASSWORD || env.DEMO_PASSWORD.length < 16) throw new Error("DEMO_PASSWORD (16+ chars) missing in .env.local");
const hash = bcrypt.hashSync(env.DEMO_PASSWORD, 10);

const users = [
  ["0e000000-0000-4000-8000-0000000000a1", "maya@larkspur-bakery.test", "Maya Ortiz", "client", "'11111111-1111-4111-8111-111111111111'"],
  ["0e000000-0000-4000-8000-0000000000b2", "sam@harborlane-yoga.test", "Sam Okafor", "client", "'22222222-2222-4222-8222-222222222222'"],
  ["0e000000-0000-4000-8000-0000000000c3", "admin@fernhill-studio.test", "Priya Shah", "admin", "null"],
];

let sql = "";
for (const [id, email, name, role, client] of users) {
  sql += `
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
values ('00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', '${email}', '${hash}', now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"${name}"}', now(), now(), '', '', '', '', '', '', '', '')
on conflict (id) do update set encrypted_password = excluded.encrypted_password;
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('${id}', '${id}', '{"sub":"${id}","email":"${email}","email_verified":true}', 'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;
insert into portal.profiles (id, full_name, role, client_id) values ('${id}', '${name}', '${role}', ${client})
on conflict (id) do nothing;
`;
}
process.stdout.write(sql);

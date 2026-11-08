-- Client portal schema: clients, projects, invoices, files, status updates, activity.
-- Every table has row-level security. Clients read only rows of their own client_id;
-- admins read everything; only admins write. The activity log is written by triggers.

-- Everything lives in its own `portal` schema so it can share a Supabase project without
-- touching anything in `public`. Outside this schema the migration adds only: one storage
-- bucket (portal-client-files) and three storage.objects policies named "portal: ...".
create schema portal;
revoke all on schema portal from public, anon;
grant usage on schema portal to authenticated;

-- ---------- tables ----------
create table portal.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table portal.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('client', 'admin')),
  client_id uuid references portal.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint client_role_has_client check (role = 'admin' or client_id is not null)
);

create table portal.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients (id) on delete cascade,
  name text not null,
  status text not null default 'in_progress'
    check (status in ('planning', 'in_progress', 'review', 'done')),
  progress int not null default 0 check (progress between 0 and 100),
  due_date date,
  created_at timestamptz not null default now()
);

create table portal.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients (id) on delete cascade,
  project_id uuid references portal.projects (id) on delete set null,
  number text not null unique,
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'open' check (status in ('open', 'paid')),
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table portal.files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients (id) on delete cascade,
  project_id uuid references portal.projects (id) on delete set null,
  name text not null,
  storage_path text not null unique,
  size_bytes bigint not null default 0,
  uploaded_by uuid references auth.users (id) on delete set null,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table portal.status_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references portal.projects (id) on delete cascade,
  client_id uuid not null references portal.clients (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  author_id uuid references auth.users (id) on delete set null,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table portal.activity (
  id bigint generated always as identity primary key,
  client_id uuid references portal.clients (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index on portal.projects (client_id);
create index on portal.invoices (client_id);
create index on portal.files (client_id);
create index on portal.status_updates (client_id, created_at desc);
create index on portal.activity (client_id, created_at desc);

-- status_updates.client_id must match its project's client (stops an admin typo
-- from leaking an update to the wrong client)
create function portal.status_update_client_matches() returns trigger
language plpgsql set search_path = '' as $$
begin
  select p.client_id into new.client_id from portal.projects p where p.id = new.project_id;
  if new.client_id is null then raise exception 'unknown project'; end if;
  return new;
end $$;
create trigger status_updates_client before insert or update on portal.status_updates
  for each row execute function portal.status_update_client_matches();

-- ---------- helpers (security definer so policies don't recurse into profiles) ----------
create function portal.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from portal.profiles where id = auth.uid() and role = 'admin')
$$;

create function portal.my_client_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select client_id from portal.profiles where id = auth.uid()
$$;

revoke all on function portal.is_admin() from public, anon;
revoke all on function portal.my_client_id() from public, anon;
grant execute on function portal.is_admin() to authenticated;
grant execute on function portal.my_client_id() to authenticated;

-- ---------- row-level security ----------
alter table portal.clients enable row level security;
alter table portal.profiles enable row level security;
alter table portal.projects enable row level security;
alter table portal.invoices enable row level security;
alter table portal.files enable row level security;
alter table portal.status_updates enable row level security;
alter table portal.activity enable row level security;

-- anon gets nothing at all; authenticated gets table rights that RLS then filters row by row
revoke all on all tables in schema portal from public, anon, authenticated;
grant select on all tables in schema portal to authenticated;
grant update on portal.invoices to authenticated;
grant insert, delete on portal.files to authenticated;
grant insert on portal.status_updates to authenticated;

create policy "read own client or admin" on portal.clients for select to authenticated
  using ((select portal.is_admin()) or id = (select portal.my_client_id()));

create policy "read self or admin" on portal.profiles for select to authenticated
  using ((select portal.is_admin()) or id = (select auth.uid()));

create policy "read own or admin" on portal.projects for select to authenticated
  using ((select portal.is_admin()) or client_id = (select portal.my_client_id()));
create policy "admin writes" on portal.projects for all to authenticated
  using ((select portal.is_admin())) with check ((select portal.is_admin()));

create policy "read own or admin" on portal.invoices for select to authenticated
  using ((select portal.is_admin()) or client_id = (select portal.my_client_id()));
create policy "admin updates" on portal.invoices for update to authenticated
  using ((select portal.is_admin())) with check ((select portal.is_admin()));

create policy "read own or admin" on portal.files for select to authenticated
  using ((select portal.is_admin()) or client_id = (select portal.my_client_id()));
create policy "admin inserts" on portal.files for insert to authenticated
  with check ((select portal.is_admin()));
create policy "admin deletes" on portal.files for delete to authenticated
  using ((select portal.is_admin()));

create policy "read own or admin" on portal.status_updates for select to authenticated
  using ((select portal.is_admin()) or client_id = (select portal.my_client_id()));
create policy "admin inserts" on portal.status_updates for insert to authenticated
  with check ((select portal.is_admin()));

create policy "read own or admin" on portal.activity for select to authenticated
  using ((select portal.is_admin()) or client_id = (select portal.my_client_id()));
-- no insert/update/delete policy on activity: only the triggers below write it

-- ---------- activity log triggers ----------
create function portal.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if tg_table_name = 'invoices' then
    if new.status = 'paid' and old.status is distinct from 'paid' then
      insert into portal.activity (client_id, actor_id, action, detail)
      values (new.client_id, actor, 'invoice_paid',
              'Invoice ' || new.number || ' marked paid');
    end if;
  elsif tg_table_name = 'files' then
    insert into portal.activity (client_id, actor_id, action, detail)
    values (new.client_id, actor, 'file_uploaded', 'File uploaded: ' || new.name);
  elsif tg_table_name = 'status_updates' then
    insert into portal.activity (client_id, actor_id, action, detail)
    values (new.client_id, actor, 'status_posted',
            'Status update on ' ||
            coalesce((select name from portal.projects where id = new.project_id), 'a project'));
  end if;
  return new;
end $$;

create trigger invoices_activity after update on portal.invoices
  for each row execute function portal.log_activity();
create trigger files_activity after insert on portal.files
  for each row execute function portal.log_activity();
create trigger status_updates_activity after insert on portal.status_updates
  for each row execute function portal.log_activity();

-- sign-in events (called by the app right after a successful sign-in)
create function portal.log_sign_in() returns void
language sql security definer set search_path = '' as $$
  insert into portal.activity (client_id, actor_id, action, detail)
  select p.client_id, p.id, 'signed_in', p.full_name || ' signed in'
  from portal.profiles p where p.id = auth.uid()
$$;
revoke all on function portal.log_sign_in() from public, anon;
grant execute on function portal.log_sign_in() to authenticated;

-- paid_at is set by the database, not trusted from the client
create function portal.invoice_paid_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    new.paid_at := now();
  elsif new.status = 'open' then
    new.paid_at := null;
  end if;
  return new;
end $$;
create trigger invoices_paid_at before update on portal.invoices
  for each row execute function portal.invoice_paid_at();

-- ---------- storage: private bucket, first path segment = client_id ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portal-client-files', 'portal-client-files', false, 5242880,
        array['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv'])
on conflict (id) do nothing;

create policy "portal: read own folder or admin" on storage.objects for select to authenticated
  using (bucket_id = 'portal-client-files' and (
    (select portal.is_admin())
    or (storage.foldername(name))[1] = (select portal.my_client_id())::text));
create policy "portal: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-client-files' and (select portal.is_admin()));
create policy "portal: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'portal-client-files' and (select portal.is_admin()));

-- ---------- demo reset (admin only): undo what visitors changed ----------
create function portal.reset_demo() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not portal.is_admin() then raise exception 'admins only'; end if;
  delete from portal.status_updates where not is_seed;
  delete from portal.files where not is_seed;
  update portal.invoices set status = 'open' where number in ('NB-1003', 'HY-2002') and status = 'paid';
  delete from portal.activity where action = 'signed_in' and created_at < now() - interval '1 day';
  insert into portal.activity (client_id, actor_id, action, detail)
  values (null, auth.uid(), 'demo_reset', 'Demo data reset by the admin');
end $$;
revoke all on function portal.reset_demo() from public, anon;
grant execute on function portal.reset_demo() to authenticated;

-- trigger functions are never callable over the API
revoke all on function portal.log_activity() from public, anon, authenticated;
revoke all on function portal.status_update_client_matches() from public, anon, authenticated;
revoke all on function portal.invoice_paid_at() from public, anon, authenticated;
revoke all on all sequences in schema portal from public, anon, authenticated;

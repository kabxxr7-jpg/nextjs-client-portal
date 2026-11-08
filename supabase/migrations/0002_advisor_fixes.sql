-- Fixes the Supabase security advisor findings that appeared once `portal` was exposed
-- through the Data API (lint 0029: signed-in users could call SECURITY DEFINER functions
-- over /rest/v1/rpc).
--
-- 1. The two RLS helpers move to `portal_private`, a schema the Data API does not expose.
--    Policies point at functions by oid, so every existing policy keeps working unchanged.
-- 2. reset_demo becomes SECURITY INVOKER: it runs with the caller's rights, so RLS applies
--    to it like to any other query (and non-admins get "admins only").
-- 3. log_sign_in is removed (sign-ins are no longer written to the activity log) rather than
--    leaving a definer function callable over the API.

create schema portal_private;
revoke all on schema portal_private from public, anon;
grant usage on schema portal_private to authenticated;

alter function portal.is_admin() set schema portal_private;
alter function portal.my_client_id() set schema portal_private;

drop function portal.log_sign_in();

drop function portal.reset_demo();
create function portal.reset_demo() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not portal_private.is_admin() then raise exception 'admins only'; end if;
  delete from portal.status_updates where not is_seed;
  delete from portal.files where not is_seed;
  update portal.invoices set status = 'open'
    where number in ('NB-1003', 'HY-2002') and status = 'paid';
end $$;
revoke all on function portal.reset_demo() from public, anon;
grant execute on function portal.reset_demo() to authenticated;

-- reset_demo now deletes visitor status updates with the admin's own rights
grant delete on portal.status_updates to authenticated;
create policy "admin deletes" on portal.status_updates for delete to authenticated
  using ((select portal_private.is_admin()));

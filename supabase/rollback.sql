-- Removes the portal and nothing else: the portal schema (tables, functions, triggers),
-- its storage policies and bucket, and the three demo users. Does not touch `public`.
-- Storage objects must be emptied first through the API or dashboard (Supabase blocks direct
-- deletes from storage.objects); then run this as postgres.
drop policy if exists "portal: read own folder or admin" on storage.objects;
drop policy if exists "portal: admin upload" on storage.objects;
drop policy if exists "portal: admin delete" on storage.objects;
delete from storage.buckets where id = 'portal-client-files';
drop schema if exists portal cascade;
delete from auth.users where id in (
  '0e000000-0000-4000-8000-0000000000a1',
  '0e000000-0000-4000-8000-0000000000b2',
  '0e000000-0000-4000-8000-0000000000c3'
);
-- afterwards: remove `portal` from Project Settings > Data API > Exposed schemas

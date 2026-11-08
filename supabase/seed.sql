-- Demo data for the fictional agency "Fernhill Studio" and two fictional clients.
-- Users are created separately (scripts/seed-users.mjs prints the SQL with a bcrypt hash,
-- so the demo password never sits in this repo).

insert into public.clients (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'Larkspur Bakery'),
  ('22222222-2222-4222-8222-222222222222', 'Harbor Lane Yoga')
on conflict (id) do nothing;

insert into public.projects (id, client_id, name, status, progress, due_date) values
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Website redesign', 'in_progress', 65, current_date + 21),
  ('a1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Online ordering', 'planning', 10, current_date + 60),
  ('a1000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Brand photo shoot', 'done', 100, current_date - 14),
  ('b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Class booking app', 'review', 90, current_date + 7),
  ('b2000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Email newsletter setup', 'in_progress', 40, current_date + 30)
on conflict (id) do nothing;

insert into public.invoices (id, client_id, project_id, number, amount_cents, status, due_date, paid_at) values
  ('c1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'a1000000-0000-4000-8000-000000000003', 'NB-1001', 180000, 'paid', current_date - 20, now() - interval '18 days'),
  ('c1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'a1000000-0000-4000-8000-000000000001', 'NB-1002', 250000, 'paid', current_date - 5, now() - interval '4 days'),
  ('c1000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'a1000000-0000-4000-8000-000000000001', 'NB-1003', 250000, 'open', current_date + 10, null),
  ('d2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'b2000000-0000-4000-8000-000000000001', 'HY-2001', 320000, 'paid', current_date - 30, now() - interval '29 days'),
  ('d2000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'b2000000-0000-4000-8000-000000000001', 'HY-2002', 320000, 'open', current_date + 3, null)
on conflict (id) do nothing;

insert into public.status_updates (project_id, client_id, body, is_seed, created_at) values
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Homepage and menu pages are designed. Next: the catering page and mobile checks.', true, now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Final edited photos are in Files. 42 images, web and print sizes.', true, now() - interval '12 days'),
  ('b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Booking flow is ready for your review on the test link. Please try a class booking and a cancellation.', true, now() - interval '1 day'),
  ('b2000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Welcome email drafted; waiting on your logo files.', true, now() - interval '3 days');

insert into public.activity (client_id, action, detail, created_at) values
  ('11111111-1111-4111-8111-111111111111', 'status_posted', 'Status update on Website redesign', now() - interval '2 days'),
  ('22222222-2222-4222-8222-222222222222', 'status_posted', 'Status update on Class booking app', now() - interval '1 day');

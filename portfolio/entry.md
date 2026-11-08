# Portfolio entry: Next.js + Supabase client portal (nextjs-portal)

Status: live at https://fernhill-client-portal.vercel.app since 2026-11-09 (Vercel; Supabase free plan, in its own schema inside the shared "kabiir" project). Verified 2026-11-09: 98/98 tests (59 row-level security tests against the live database), live browser run passed. Repo not published yet (waiting for the user's go); proposed: https://github.com/kabxxr7-jpg/nextjs-client-portal

## Title (max 70)
Next.js + Supabase Client Portal With Row-Level Security

## Description (under 600 characters; this one is 539)
A working client portal for a fictional design agency, built with Next.js (App Router, TypeScript) and Supabase. Clients sign in and see only their own projects, invoices, files and status updates; the agency admin sees everything, uploads files, posts updates and marks invoices paid. Access is enforced in Postgres with row-level security and private storage rules, not just hidden in the page, and a live test suite proves one client can't read another's data. Activity log, light and dark mode, works on a phone. One-click demo logins.

## Skills (Upwork tags)
Next.js, Supabase, PostgreSQL, Row Level Security, TypeScript, React, Vercel, Authentication, Web Application, Customer Portal

## Link
https://fernhill-client-portal.vercel.app (one-click demo logins on the home page)

## Screenshots (light mode, 2x, fictional names, no phone numbers or emails shown; in this folder)
1. `1-try-it-demo-logins.png` - public try-it page: one-click client and admin logins, what to try, how access is enforced
2. `2-client-overview.png` - a client's overview: only their projects, open invoice, latest updates, activity
3. `3-security-check-blocked.png` - live queries as one client against the other client's data: 10 of 10 blocked by the database
4. `4-admin-all-invoices.png` - admin sees every client's invoices and can mark one paid
5. `5-admin-post-update-and-upload.png` - admin posts a status update and uploads a file into a client's private folder
6. `6-phone-client-invoices.png` - phone width: invoices stack into cards

All screenshots are from the live site on 2026-11-09 (headless Chromium, light mode).

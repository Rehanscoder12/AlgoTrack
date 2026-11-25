# AlgoTrack

A public DSA question and computer science resource tracker built with React, Vite, Tailwind CSS, and Supabase. Visitors can browse without an account; question progress is stored only in their browser.

## Local development

1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set the Supabase project URL and **anon** key.
4. Apply `supabase/schema.sql` in the Supabase SQL Editor.
5. Deploy the `admin-content` Edge Function and set its secrets as described below.
6. Run `npm run dev`. Use `npm run build` to create the production bundle.

The public pages work without credentials as an empty-state preview, but shared content and admin actions require a configured Supabase project.

## Secure owner admin

There is no public account or signup system. The admin password is verified by the `admin-content` Edge Function, never by the browser. The function issues a short-lived signed admin token; create/update/delete requests are accepted only after it is verified server-side. The Edge Function uses the service role key, which must never be placed in frontend environment variables.

From the Supabase project directory:

```sh
supabase functions deploy admin-content
supabase secrets set ADMIN_PASSWORD='use-a-long-unique-password' ADMIN_SESSION_SECRET='use-a-random-secret-at-least-32-characters'
```

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Keep those server-side. Do not enable public insert/update/delete policies. Anyone can read content; only the Edge Function performs writes.

## Data and progress

Run `supabase/schema.sql` once. The tables expose read-only rows to the `anon` and `authenticated` roles through RLS. Local progress uses a browser-specific `localStorage` key and is not sent to Supabase.

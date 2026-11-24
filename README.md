# Lakshtech Frame Studio

Mobile-friendly frame editor for community campaigns. Visitors choose an active frame, add a photo, adjust the crop, and export a PNG. The admin page lets an authorized manager upload and edit the shared frame gallery.

## Frontend and backend

The website is a static Vercel app. Supabase provides authentication, Postgres frame records, public frame-image storage, Row Level Security, and live gallery updates. The existing publishable/anon browser key is used; never put a service-role key in frontend code.

## Supabase setup

1. In the Supabase SQL Editor, run `schema-frame-editor.sql`, then `schema-frame-admin.sql`.
2. Create a user from `admin.html` using the same Supabase project as `supabase-config.js` (or create the Auth user in Supabase).
3. In Supabase SQL Editor, replace `YOUR_ADMIN_EMAIL` in the final commented statement of `schema-frame-admin.sql`, uncomment it, and run it once. Only this database role grants admin access.
4. Deploy the repository root to Vercel. Open `/admin.html`, sign in, and add or update frames. Active records appear in `index.html`; database changes are broadcast to open gallery pages.

The admin page requires an authenticated user listed in `public.frame_admins`. Public visitors can read active templates only. Admin insert, update, visibility, and storage actions are restricted by database policies. The storage bucket allows PNG, WebP, and JPEG images up to 12 MB.

## Run locally

Open `index.html` through a local web server (for example, `python -m http.server 8000`) rather than opening the file directly, so Supabase scripts and storage URLs load correctly. Then visit `http://localhost:8000`. Open `http://localhost:8000/admin.html` for the manager login.

If Supabase is not reachable or has no active templates yet, the visitor page falls back to the built-in sample frames. The backend gallery becomes the source once active database frames are available.

## Privacy and limits

Visitors' personal photos remain in the browser and are not uploaded by the editor. Only the frame overlay images uploaded by a manager are stored in Supabase Storage. This project creates event share links locally; that separate demo flow is not a shared event database.

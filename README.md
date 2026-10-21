# Lakshtech — Unified Website Files

All project files are combined in one root folder (no separate project folders).

- `index.html` — primary website to deploy on Vercel
- `design-*.html` — alternate design versions preserved for reference
- `assets/` — shared logo/images
- `schema.sql` and `supabase-config.js` — optional Supabase setup files; review configuration and never expose secret/service-role keys in frontend code.

## Deploy on Vercel
Upload this extracted folder to a Git repository and import it into Vercel, or use Vercel's deploy flow. The root directory should be this folder. This is a static HTML site; backend/contact form and Supabase integration need separate verification/configuration before production.

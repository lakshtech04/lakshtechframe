# Lakshtech Frame Editor Backend

Backend setup for a MyFrame-style photo/frame editor using Supabase and Vercel.

## Included features
- Supabase Auth (email/password)
- Public frame template catalog
- Per-user saved designs metadata
- Private user design exports bucket (optional)
- Row Level Security policies
- Vercel deployment configuration

## Setup
1. In Supabase Dashboard → SQL Editor, run `backend/schema-frame-editor.sql`.
2. In Supabase Authentication → Providers, enable Email. Configure email confirmation as desired.
3. Ensure the root `supabase-config.js` has your project URL and publishable key. Never put a service-role/secret key in browser files.
4. Deploy the project root to Vercel. For a static frontend, no server-side secret is required for the included Supabase operations.
5. Add frame template records and upload PNG overlays to the `frame-templates` storage bucket. Use transparent PNGs for overlays.

## Important
This is a backend scaffold, not a claim that the app has been deployed or that auth/storage have been tested against your live Supabase project. Portrait processing should remain in the browser unless you intentionally build a private upload workflow.

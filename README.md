# Lakshtech Frame Studio

A simple, mobile-first Hindi frame editor prototype for community events.

## Included
- `index.html`: home page, frame gallery, local photo editor, event creation/share-link UI.
- `backend/schema.sql`: Supabase tables and starter RLS policies for events and submissions.
- `backend/supabase-config.example.js`: safe frontend config template (publishable/anon key only).
- `vercel.json`: basic Vercel configuration.

## Important: current event link mode
The event creation UI currently makes a demo URL and stores event metadata in the browser's local storage. It is **not yet a cross-device/live event link system**. For real sharing, connect Supabase using the project URL and publishable key, create events in `frame_events`, and resolve public event links by `slug`. Photo uploads should use a Supabase Storage bucket with carefully configured policies; never expose a service-role key in browser code.

## Setup
1. Create/open your Supabase project.
2. Run `backend/schema.sql` in Supabase SQL Editor.
3. Create a private or appropriately policy-restricted storage bucket for user uploads. Review storage policies before collecting real photos.
4. Add Supabase URL and publishable/anon key to your frontend config and wire the event create/load/submit functions to Supabase.
5. Deploy the folder containing `index.html` to Vercel.

## Privacy
This product handles people's photos. Tell users how photos are used, collect only what is needed, allow deletion, and set upload size/type limits. Public event links should use unguessable IDs and should not expose organizer-only submissions.
